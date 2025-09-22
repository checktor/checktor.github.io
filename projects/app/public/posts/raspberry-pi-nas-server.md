# Raspberry Pi NAS server

<img src="/imgs/raspberry-pi.jpg" alt="Raspberry Pi" width="50%" height="auto"/>

Image by [Jainath Ponnala](https://unsplash.com/de/@jainath?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash) on [Unsplash](https://unsplash.com/de/fotos/schwarzes-und-blaues-usb-kabel-9wWX_jwDHeM?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash).

## TL;DR

Configuring a Raspberry Pi as NAS server inside your local network isn't that complicated.

### What do I need?

* Hardware: [Raspberry Pi](https://www.raspberrypi.com/products/) computer, external hard drive (preferably SSD connected via USB).
* Software: [Raspberry Pi OS](https://www.raspberrypi.com/software/operating-systems/), a few tools installed with [APT](https://wiki.ubuntuusers.de/APT/) package manager.

### What to do?

* Set up Raspberry Pi with OS image written to SD card.
* Configure network connection and enable SSH server for remote access.
* Mount external hard drive to specific folder.
* Install and configure Samba server to share mounted folder within the network.

But that's not the full scope of this blog post. I will have a deeper look into each configuration step searching for security and performance best practices. Getting it to run is simply not enough, I want it to be as secure and fast as possible.

## Raspberry Pi OS

Let's start from the beginning. Namely, from basic Raspberry Pi OS configuration. I always recommend to use minimal base images with the least amount of pre-installed software possible. In this case, [Raspberry Pi OS Lite](https://downloads.raspberrypi.com/raspios_lite_arm64/images/raspios_lite_arm64-2025-05-13/2025-05-13-raspios-bookworm-arm64-lite.img.xz). It never hurts to verify SHA256 file integrity hash before writing the image to SD card.

```shell
sha256sum /path/to/2025-05-13-raspios-bookworm-arm64-lite.img.xz
```

On first startup, you need to choose keyboard layout and create user with corresponding password. Needless to say that this password should be sufficiently strong. After first login, you probably want to run `sudo raspi-config` for further configuration.

* **Localisation options**: configure locale, timezone and WLAN country.
* **Advanced options**: expand filesystem to entire SD card.
* **Interface options**: enable SSH server.
* **System options**: configure wireless LAN (if needed). I personally prefer a wired connection due to increased performance and stability.
* **System options**: adjust hostname (in case *raspberrypi* as default is not sufficient).

Applying these changes requires a reboot before you are able to connect remotely.

```shell
ssh <username>@<IP-address>
```

On first connection attempt, you will be asked to verify ED25519 key fingerprint. What does this mean?

Each SSH server generates its own set of key pairs during installation. With them, clients are able to verify the server's identity in order to avoid accidentally trying to log in to an attacker's machine disguised as desired server (man-in-the-middle (MITM) attack). Such "host keys" are usually placed in `/etc/ssh` folder, its exact path is configured in `/etc/ssh/sshd_config` file (see *HostKey* parameter). In this case, the relevant fingerprint can be retrieved with the following command.

```shell
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

It is a good habit to always double-check SSH key fingerprints. Most services publicly announce them, e.g. [GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints/), [GitLab](https://gitlab.com/help/instance_configuration/) or [BitBucket](https://support.atlassian.com/bitbucket-cloud/docs/configure-ssh-and-two-step-verification/). When fingerprint is accepted during first connection, corresponding information will be written as hash to local `~/.ssh/known_hosts` file. As long as fingerprint is unchanged, future logins will no longer ask for verification. Therefore, data in this file is relevant for IT security and needs to be handled with care.

After successfully logged in, don't forget to run a full system upgrade.

```shell
sudo apt update && sudo apt upgrade && sudo apt autoremove
```

You might want to install and configure *unattended-upgrades* package in order to automate update procedure.

## Firewall

Digging deeper into OS configuration, I quickly stumbled across unexpected defaults. Raspberry Pi OS as well as other Debian-based distributions do not configure any firewall out-of-the-box. In other words, when you run a service opening a port on your system, like SSH server, it will be accessible for everybody in your local network (or whatever network you are currently connected with). Let's change that. Assuming you use IP range 192.168.1.0/24 of your internal network, we want to allow incoming TCP traffic to port 22 (SSH) only for clients within this subnet.

```shell
sudo apt install ufw
sudo ufw enable && sudo ufw allow proto tcp from 192.168.1.0/24 to any port 22
```

According to the least privilege principle, we make the rule as specific as possible, e.g. by only allowing TCP traffic to port 22 and therefore discarding UDP and other ports. UDP is not necessary for SSH to work and might be used in distributed denial of service (DDoS) attacks. You might want to think about segmenting your network further, e.g. by creating a dedicated subnet for IoT devices with restricted access. It totally makes sense to become familiar with the details and apply them appropriately to your needs.

## SSH

Remote access with SSH, check! You can now move the Raspberry Pi to a corner of your apartment where it won't bother anyone. But let's have a closer look to SSH configuration.

### Client

Currently, each login requires a password. An attacker could brute-force its way in by using prepared password lists and a lot of computing power. Let's avoid this by creating our own SSH key.

```shell
ssh-keygen
```

On recent Ubuntu releases, this command automatically generates a key pair of type *EdDSA* and stores it as `id_ed25519` and `id_ed25519.pub` files in `~/.ssh` folder. On other systems, you might need to run `ssh-keygen -t ed25519`. I usually prefer elliptic-curve-based key pairs like those of type *EdDSA* as being faster and more robust. On key creation, you will be asked for a passphrase in order to encrypt private part of the key. You can leave this field empty skipping the encryption, but it offers an additional layer of security which should be considered. We now need to copy public part of the key, i.e. *\*.pub* file, to remote server.

```shell
ssh-copy-id -i ~/.ssh/id_ed25519.pub <username>@<IP-address>
```

When running this command, Raspberry Pi receives provided key and stores it in `~/.ssh/authorized_keys` file. For convenience, you might want to create `~/.ssh/config` file on your computer in order to use `ssh <meaningful-name>` instead of `ssh <username>@<IP-address>`.

```
Host <meaningful-name>
    HostName <IP-address>
    User <username>
    IdentityFile ~/.ssh/id_ed25519.pub
    IdentitiesOnly yes
```

The *HostName* and *User* fields are self-explanatory. In *IdentityFile* line, you insert the path to public key previously copied to server. *IdentitiesOnly yes* avoids SSH to try every key stored in `.ssh` folder in case the specified one does not work. In my point of view, this is unexpected behaviour. I usually have multiple SSH keys on my system and I do not want SSH to send unrelated keys to remote servers in case of a typo in my SSH configuration.

The files in `.ssh` folder are sensitive information. Therefore, its access rights are important.

```shell
ls -la ~/.ssh/
```

```
drwx------  ...   .
-rw-------  ...   config
-rw-------  ...   id_ed25519
-rw-r--r--  ...   id_ed25519.pub
-rw-------  ...   known_hosts
```

Only *\*.pub* files are expected to be public and therefore readable by *others* (644). All other files should only be accessible by its owner (600). This also applies to `.ssh` folder itself (700). In case of remote servers, `authorized_keys` file needs to be protected the same way. Accidentally allowing each user to read SSH keys makes it easy for an attacker to spread across the network. Keep in mind that there are lots of users on a typical Linux system, most of them technical ones (see `/etc/passwd` file). An attacker could potentially manage to execute malicious code as any of these users.

### Server

Let's have a deeper look into [SSH server configuration](https://www.man7.org/linux/man-pages/man5/sshd_config.5.html) file.

```shell
sudo nano /etc/ssh/sshd_config
```

We might want to change a few parameters before restarting SSH daemon with `sudo systemctl restart sshd.service`.

```
PermitRootLogin no
PasswordAuthentication no
PermitEmptyPasswords no
X11Forwarding no
```

What is this all about?

* **PermitRootLogin no**: does not allow user *root* to log in.
* **PasswordAuthentication no**: does not allow password authentication in general.
* **PermitEmptyPasswords no**: does not allow logins with empty password strings, e.g. using technical users.

Linux itself usually disables logins for technical users (see last part of each entry in `/etc/passwd` file). So setting *PermitEmptyPasswords* to *no* adds an extra layer of security. The last parameter, *X11Forwarding*, catches the eye. In case X11 window manager is installed and in use (see *advanced options* in *raspi-config*), this parameter allows to forward graphical user interface through SSH tunnel. In other words, when logged in with SSH you can run graphical tools on Raspberry Pi and see the corresponding window on your computer. This can be tested by adding *-Y* flag to *ssh* command, e.g. `ssh -Y <username>@<IP-address>`. This option defaults to *no* but is explicitly enabled in this case. We do not need this feature, so we should disable it again.

Another way to mitigate potential DDoS attacks is to install and configure [fail2ban](https://github.com/fail2ban/fail2ban/). This tool searches logs of various services including SSH for failed login attempts. Corresponding IP addresses will be blocked for a specific amount of time if too many successive authentication requests fail.

```shell
sudo apt install fail2ban
```

Thankfully, this tool is already configured for SSH. In case of Raspberry Pi OS, there is only one simple change to do, namely add *backend = systemd* line under *[sshd]* section in `/etc/fail2ban/jail.d/defaults-debian.conf` file. Make sure to restart the service afterward: `sudo systemctl restart fail2ban.service`.

## Linux configuration

### sudo

You might have noticed that running a command with *sudo* does not require a password. This behaviour is not default but explicitly configured in `/etc/sudoers.d/010_pi-nopasswd` file.

```shell
<username> ALL=(ALL) NOPASSWD: ALL
```

Open file with `sudo visudo /etc/sudoers.d/010_pi-nopasswd` and use *#* to comment out this line. The main configuration file `/etc/sudoers` already allows all users of group *sudo* to execute any command with root rights. Your current user is already part of group *sudo*.

```
%sudo ALL=(ALL:ALL) ALL
```

### Wireless devices

Raspberry Pi computers typically have built-in WLAN and Bluetooth adapters. Let's have a look.

```shell
rfkill --output-all
```

```
ID TYPE      DEVICE TYPE-DESC    SOFT      HARD
 0 bluetooth hci0   Bluetooth    unblocked unblocked
 1 wlan      phy0   Wireless LAN unblocked unblocked
```

Both devices are present and unblocked. Let's also check network configuration.

```shell
ip address
```

```
1: lo:     ...  state UNKNOWN group default qlen 1000
    ...
2: eth0:   ...  state UP group default qlen 1000
    ...
3: wlan0:  ...  state DOWN group default qlen 1000
    ...
```

There are two network interfaces available, namely *eth0* for wired and *wlan0* for wireless connections. Notice *UP* and *DOWN* flags near the end of each line indicating that only wired *eth0* interface is enabled. As wireless LAN is not in use and Bluetooth not needed, we can safely disable both. Raspberry Pi OS allows to configure hardware in `/boot/firmware/config.txt` file which will be applied at boot time. Add the following lines to *[all]* section at the end of the file.

```
dtoverlay=disable-wifi
dtoverlay=disable-bt
```

After rebooting, both wireless devices are no longer available. Make sure to carefully read [config.txt documentation](https://www.raspberrypi.com/documentation/computers/config_txt.html) before changing any parameter. Mistakes will lead to failures at Raspberry Pi startup.

## USB

We want to mount an external hard drive connected via USB for additional storage. Starting with Raspberry Pi model 4B, USB 3.0 (or USB 3.2 Gen 1x1) ports are available (usually the more "blueish" ones). Most external hard drives support USB 3, so we should use this kind of connection. I assume that hard drive is properly formatted with *ext4* file system for best performance. Other file systems are possible, e.g. *FAT* allowing platform-independent usage. For the latter, make sure to replace *ext4* with *vfat* in mount configuration below.

Let's find out connected hard drive's device name.

```shell
lsblk
```

```
sda     8:0  1  58,6G  0  disk
└─sda1  8:1  1  58,6G  0  part
```

Here, a device with 58,6 GB storage called *sda1* is connected. Based on name, we can get corresponding unique ID.

```shell
ls -la /dev/disk/by-uuid/
```

```
lrwxrwxrwx  ...  <uuid> -> ../../sda1
```

Using this UUID, we can mount USB device to a folder of our choice. Let's create `/mnt/usb-primary` directory and mount external hard drive to it.

```shell
sudo mkdir /mnt/usb-primary
sudo mount UUID=<uuid> /mnt/usb-primary
```

To persist this setup on reboot, edit `/etc/fstab` file and add the following line.

```
UUID=<uuid>  /mnt/usb-primary  ext4  defaults,nofail  0  3
```

Right-most column containing number *3* indicates the order of mounts (low to high) and is therefore dependent on other mount definitions. Focus on *defaults,nofail* entry in fourth column. We are using default mount options and add *nofail* parameter. It preserves the system to fail on reboot in case USB device is not connected. But what are those *defaults* we are applying here?

Its meaning is platform-dependent but usually refers to *rw,suid,dev,exec,auto,nouser,async*.

* **rw**: provides read-write access.
* **suid**: takes set-user-ID (SETUID) and set-group-ID (SETGID) bits into account when executing programs.
* **dev**: interprets block or character devices.
* **exec**: allows execution of scripts or binaries.
* **auto**: device can be mounted automatically, e.g. on reboot.
* **nouser**: device cannot be mounted by ordinary users.
* **async**: executes I/O operations asynchronously.

First option, *rw*, can be changed to *ro* in case read-only access is sufficient. As we are mounting a data partition, we do not need to run executables. Hence, we can replace *exec* by its opposite *noexec*. For the same reason, block or character devices are not relevant, so we turn *dev* into *nodev*.

Parameter *suid* should be explained in more detail. It refers to SETUID and SETGID bits in Linux file permissions. They allow scripts or binaries to be executed with the rights of the file's owner or group, regardless of the invoking user. An example for this behaviour is *ping* command. It requires *root* privileges because it works with network sockets. However, you can run it without *sudo*. This is possible because `/usr/bin/ping` binary has *root* as owner and uses SETUID bit (see *s* instead of *x* in file permission string, i.e. *-rwsr-xr-x*). Therefore, *ping* will always run with rights of *root* user. Similar to above, we disable this functionality by adding *nosuid* parameter.

For performance reasons, we should consider to add mount option *noatime* preventing the system to update access times. Consult [fstab documentation](https://www.man7.org/linux/man-pages/man8/mount.8.html) for further information. Putting all changes together, the optimized *fstab* line looks like this.

```
UUID=<uuid>  /mnt/usb-primary  ext4  defaults,nosuid,nodev,noexec,nofail,noatime  0  3
```

## Samba

We are now ready to install Samba server.

```shell
sudo apt install samba
```

First, we need to create Samba user linked to current Linux account. Make sure to specify a different password.

```shell
sudo smbpasswd -a <username>
```

Samba is communicating on TCP port 445. Create a firewall rule allowing necessary traffic the same way we did with SSH.

```shell
sudo ufw allow proto tcp from 192.168.1.0/24 to any port 445
```

Let's have a look at [Samba server configuration](https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html) file.

```shell
sudo nano /etc/samba/smb.conf
```

There are a few unexpected settings, especially in "Share Definitions" part near the end. The *[homes]* section configures each user's home directory, i.e. `/home/<username>`, to be shared in read-only mode. According to *[printers]* section, available printers are also accessible in local network. Let's remove all shares below "Share Definitions" comment and replace them with our own configuration called *[shared]*.

```
[shared]
    comment = Raspberry Pi Shared Folder
    path = /mnt/usb-primary
    browseable = no
    writeable = yes
    create mask = 640
    directory mask = 750
    valid users = <username>
```

Let's have a closer look at these parameters.

* **browseable = no**: share is not shown in browse list, it needs to be accessed by name.
* **writeable = yes**: use share in read-write mode (change to *no* for read-only access).
* **create mask = 640**: default access permissions of newly created files.
* **directory mask = 750**: default access permissions of newly created folders.
* **valid users = \<username\>**: users allowed to access.

Note that *create mask* and *directory mask* options set 640 and 750 as default file permissions on shared files and directories basically discarding *others* from access. So Samba share is restricted to our current user (see *valid users* parameter) and so are the files in file system.

We also need to adjust a few settings in *[global]* section.

```
[global]
    bind interfaces only = yes
    interfaces = 127.0.0.0/8 eth0
    map to guest = never
    server smb encrypt = required
    restrict anonymous = 2
    hosts allow = 192.168.1.0/24
    hosts deny = 0.0.0.0/0
```

Uncommenting *bind interfaces only* and *interfaces* parameters adds an extra layer of security by explicitly defining network interfaces allowed to communicate with Samba. Loopback interface *127.0.0.0/8* is necessary to run internal commands like *smbpasswd*. Parameter *map to guest* is reset to its default *never* meaning that login requests with invalid passwords will always be rejected. During Samba installation, this parameter was set to *bad user*. In this case, users with invalid passwords will only be rejected if username is known. Otherwise, it is treated as guest login and therefore mapped to guest account. Setting *server smb encrypt = required* forces clients to use SMB encryption. With *restrict anonymous = 2*, anonymous or guest logins are disabled globally. Parameters *hosts allow* and *hosts deny* restrict all network access to Samba server except for clients in specified subnet.

After checking the correctness of configuration changes with `testparm`, we can restart Samba with `sudo systemctl restart smbd.service`.

## Client connection

In file browser, you can access Samba share using *smb://<IP-address>/shared/* server address. You will be asked to enter username and password of Samba user. As we do not have changed *workgroup* option in `smb.conf` file, you can leave *WORKGROUP* as default value in *domain* field.

## History

* 2025-09-22: Initial release.
