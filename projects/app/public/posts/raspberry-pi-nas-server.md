# Raspberry Pi NAS server

## TL;DR

Configuring a Raspberry Pi as NAS server inside your local network isn't that complicated.

### What do I need?

* Hardware: [Raspberry Pi](https://www.raspberrypi.com/products/) mini computer, external hard drive (preferably SSD).
* Software: [Raspberry Pi OS](https://www.raspberrypi.com/software/operating-systems/), a few tools installed with [APT](https://wiki.ubuntuusers.de/APT/) package manager.

### What to do?

* Set up Raspberry Pi with OS image written to SD card.
* Configure network connection and enable SSH server for remote access.
* Mount external hard drive connected via USB to a specific folder.
* Install and configure Samba server to share mounted folder within the network.

But that's not the full scope of this blog post. I will have a deeper look into each configuration step searching for security and performance best practices. Getting it to run is simply not enough, I want it to be as secure and fast as possible.

## Raspberry Pi OS

Let's start from the beginning. Namely, from basic Raspberry Pi OS configuration. I always recommend to use minimal base images with the least amount of pre-installed software possible. In this case, [Raspberry Pi OS Lite](https://downloads.raspberrypi.com/raspios_lite_arm64/images/raspios_lite_arm64-2025-05-13/2025-05-13-raspios-bookworm-arm64-lite.img.xz). It never hurts to verify SHA256 file integrity hash before writing the image to SD card.

```shell
sha256sum /path/to/2025-05-13-raspios-bookworm-arm64-lite.img.xz
```

On first startup, you need to choose keyboard layout and create a user with corresponding password. Needless to say that this password should be sufficiently strong. After first login, you probably want to run `sudo raspi-config` for further configuration.

* ***Localisation options***: configure locale, timezone and WLAN country.
* ***Advanced options***: expand filesystem to entire SD card.
* ***Interface options***: enable SSH server.
* ***System options***: configure wireless LAN (if needed). I personally prefer a wired connection due to increased performance and stability.
* ***System options***: adjust hostname (in case `raspberrypi` as default value is not sufficient).

Applying these changes requires a reboot. Then you will be able to connect to Raspberry Pi remotely.

```shell
ssh <username>@<IP-address>
```

On first connection, you will be prompted to verify ED25519 key fingerprint. What's this all about?

Each SSH server generates its own key pairs during installation. With them, clients are able to verify the server's identity in order to avoid accidentally trying to log in to an attacker's machine disguised as desired server (man-in-the-middle (MITM) attack). Such "host keys" are usually placed in `/etc/ssh` folder, its exact path is configured in `/etc/ssh/sshd_config` file (see `HostKey` parameter). In this case, the relevant fingerprint can be retrieved with the following command and needs to exactly match the one provided.

```shell
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

It is a good habit to always double-check SSH fingerprints. Most services publicly announce them, e.g. [GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/githubs-ssh-key-fingerprints/), [GitLab](https://gitlab.com/help/instance_configuration/) or [BitBucket](https://support.atlassian.com/bitbucket-cloud/docs/configure-ssh-and-two-step-verification/). When accepted, domain name and corresponding fingerprint will be written in hashed format to `~/.ssh/known_hosts` file.

After successful login, don't forget to run a full system upgrade.

```shell
sudo apt update && sudo apt upgrade && sudo apt autoremove
```

You might want to install and configure `unattended-upgrades` package in order to automate package update procedure.

## Firewall

Digging deeper into OS configuration, I quickly stumbled across unexpected defaults. Raspberry Pi OS as well as other Debian-based distributions do not configure any firewall out-of-the-box. In other words, when you run a service opening a port on your system, like SSH server, it will be accessible for everybody in your local network (or whatever network you are currently connected with). Let's change that. Assuming you use IP range 192.168.1.0/24 of your internal network, we want to allow incoming TCP traffic to port 22 (SSH) only for clients within this subnet.

```shell
sudo apt install ufw
sudo ufw enable && sudo ufw allow proto tcp from 192.168.1.0/24 to any port 22
```

According to the least privilege principle, we make the rule as specific as possible, e.g. by only allowing TCP traffic to port 22 and therefore discarding UDP and any other port. UDP is not necessary for SSH to work and might be used in distributed denial of service (DDoS) attacks. You might want to think about segmenting your network even further, e.g. by creating a dedicated subnet for IoT devices with restricted access. It totally makes sense to become familiar with the details and apply them appropriately to your needs.

## SSH

Remote access with SSH, check! You can now move the Raspberry Pi to a corner of your apartment where it won't bother anyone. But let's have a closer look to SSH configuration.

### Client

Currently, each login requires a password. An attacker could brute-force its way in by using prepared password lists and a lot of computing power. Let's avoid this by creating our own SSH key.

```shell
ssh-keygen
```

On Ubuntu 24.04, this command automatically generates a key pair of type `EdDSA` and stores it as `id_ed25519` and `id_ed25519.pub` files in `~/.ssh` folder. On other systems, you might need to run `ssh-keygen -t ed25519`. I usually prefer elliptic-curve-based key pairs like those of type `EdDSA` as being faster and more robust. On key creation, you will be asked for a passphrase in order to encrypt the private part of the key. You can leave this field empty skipping the encryption, but it offers an additional layer of security which could be considered. We now need to copy public part of key, i.e. `*.pub` file, to remote server.

```shell
ssh-copy-id -i ~/.ssh/id_ed25519.pub <username>@<IP-address>
```

With this command, Raspberry Pi receives public key and stores it in `~/.ssh/authorized_keys` file allowing to connect without providing a password. For convenience, you might want to create `~/.ssh/config` file in order to use `ssh <meaningful-name>` instead of `ssh <username>@<IP-address>`.

```
Host <meaningful-name>
    HostName <IP-address>
    User <username>
    IdentityFile ~/.ssh/id_ed25519.pub
    IdentitiesOnly yes
```

The `HostName` and `User` fields should be self-explanatory. In `IdentityFile` line, you insert the path to public key previously copied to server. `IdentitiesOnly yes` avoids SSH to try every key stored in `.ssh` folder in case the specified one does not work. In my point of view, this is unexpected behaviour. I usually have multiple SSH keys on my system and I do not want SSH to send unrelated keys to remote servers in case of a typo in my SSH configuration. This setup assures that SSH only tries the key specified and fails otherwise.

In general, the files in `.ssh` folder are sensitive information. Therefore, its access rights are important.

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

Only `*.pub` files are expected to be public and therefore readable by `others` (`644`). All other files should be only accessible by its creator (`600`). This also applies to `.ssh` folder itself (`700`). In case of remote servers, `authorized_keys` file needs to be protected the same way. Accidentally allowing each user to read SSH keys makes it easy for an attacker to spread across the network. Keep in mind that there are lots of users on a typical Linux system, most of them technical ones (see `/etc/passwd` file). An attacker could potentially manage to execute malicious code with the rights of one of these users.

### Server

Let's have a deeper look into [SSH server configuration file](https://www.man7.org/linux/man-pages/man5/sshd_config.5.html).

```shell
sudo nano /etc/ssh/sshd_config
```

We might want to change a few options before restarting SSH daemon with `sudo systemctl restart sshd`.

```
PermitRootLogin no
PasswordAuthentication no
PermitEmptyPasswords no
X11Forwarding no
```

What is the meaning of these parameters?

* ***PermitRootLogin***: do not allow user `root` to log in.
* ***PasswordAuthentication***: do not allow password authentication in general.
* ***PermitEmptyPasswords***: do not allow login with empty password string.

The last field, `X11Forwarding`, catches the eye. In case X11 window manager is installed and in use (see `Advanced options` in `raspi-config`), this parameter allows to forward graphical user interface through SSH tunnel. In other words, when logged in with SSH you can run a graphical tool on Raspberry Pi and see the corresponding window on your computer. This can be tested by adding `-Y` flag to `ssh` command, e.g. `ssh -Y <username>@<IP-address>`. This option is usually turned off, but in this case, it is explicitly enabled by default. We do not need this feature, so we should disable it again.

Another way to mitigate potential DDoS attacks is to install and configure [fail2ban](https://github.com/fail2ban/fail2ban/). This tool searches the logs of various services including SSH to find failed login attempts. Corresponding IP addresses will be blocked for a specific amount of time if too many successive authentication requests fail.

```shell
sudo apt install fail2ban
```

Thankfully, this tool is already configured for SSH. In case of Raspberry Pi OS, there is only one simple change to do, namely add `backend = systemd` line under `[sshd]` section in `/etc/fail2ban/jail.d/defaults-debian.conf` file. Make sure to restart the service afterward: `sudo systemctl restart fail2ban.service`.

## Further Linux configuration

### sudo

You might have noticed that running a command with `sudo` does not require a password. This behaviour is not default but explicitly configured for current user in `/etc/sudoers.d/010_pi-nopasswd` file.

```shell
<username> ALL=(ALL) NOPASSWD: ALL
```

Open this file with `sudo visudo /etc/sudoers.d/010_pi-nopasswd` and use `#` to comment out this line. The main configuration file `/etc/sudoers` already contains a line allowing all users of group `sudo` to execute any command with `root` rights. Your current user is already part of `sudo` group.

````
%sudo ALL=(ALL:ALL) ALL
````

### Wireless devices

Raspberry Pi computers typically have built-in WLAN and Bluetooth adapters. Let's check these devices.

```shell
rfkill --output-all
```

```
ID TYPE      DEVICE TYPE-DESC    SOFT      HARD
 0 bluetooth hci0   Bluetooth    unblocked unblocked
 1 wlan      phy0   Wireless LAN unblocked unblocked

```
Both of them are present and unblocked. Let's also check our network status.

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

There are two network devices present, namely `eth0` for wired and `wlan0` for wireless connections. Notice the `UP` and `DOWN` flags near the end of each line indicating that only wired `eth0` connection is currently in use. So WLAN and Bluetooth capabilities are not in use. Let's disable both.

In Raspberry Pi OS, we can configure hardware-based settings to be applied directly at boot time. Crucial for this is `/boot/firmware/config.txt` file. Add the following lines to `[all]` section at the end.

```
dtoverlay=disable-wifi
dtoverlay=disable-bt
```

After rebooting, both wireless devices are no longer available. You might want to consult the official documentation of [config.txt](https://www.raspberrypi.com/documentation/computers/config_txt.html) file for further options.

## USB

We now want to mount an external hard drive for additional storage. Therefore, we connect the device via USB. Starting with Raspberry Pi model 4B, a USB port version 3.0 (or USB 3.2 Gen 1x1) is available (usually the more "blueish" one). Most external hard drives recently support USB 3, so we should use this kind of connection. I assume that hard drive is properly formatted with `ext4` file system for best performance. Other file systems are possible, e.g. `FAT` in case device needs to be used platform-independent. Make sure to replace `ext4` with `vfat` in mount configuration below in case you need this configuration.

Let's find out the device name of connected hard drive using `lsblk`.

```
sda     8:0  1  58,6G  0  disk
└─sda1  8:1  1  58,6G  0  part
```

In this case, a device with 58,6 GB storage called `sda1` is connected. Based on this name, we can get corresponding unique ID.

```shell
ls -la /dev/disk/by-uuid/
```

```
lrwxrwxrwx  ...  c3648710-245d-4a4c-9c2d-c16ace8ed3c3 -> ../../sda1
```

Using this UUID, we can mount the USB device to a folder of our choice. Let's create `/mnt/usb-primary` folder for this purpose.

```shell
sudo mkdir /mnt/usb-primary
```

Let's put everything together and mount external hard drive to our newly created folder.

```shell
sudo mount UUID=c3648710-245d-4a4c-9c2d-c16ace8ed3c3 /mnt/usb-primary
```

To persist this setup on reboot, edit `/etc/fstab` file and add the following line.

```
UUID=c3648710-245d-4a4c-9c2d-c16ace8ed3c3  /mnt/usb-primary  ext4  defaults  0  3
```

Last column with number 3 indicates the order of mounts (low to high) and is therefore dependent on previous mount definitions. Focus on `defaults` entry in fourth column. What are those defaults we are applying here? Its meaning is platform-dependent but usually refers to `rw,suid,dev,exec,auto,nouser,async` options.

* ***rw***: provide read-write access.
* ***suid***: take set-user-ID or set-group-ID bits into account.
* ***dev***: consider block or character devices.
* ***exec***: allow execution of binaries stored on device.
* ***auto***: can be mounted with -a option.
* ***nouser***: ordinary users are not allowed to mount.
* ***async***: I/O operations should be done asynchronously.

Some optimizations are possible here.

```
UUID=c3648710-245d-4a4c-9c2d-c16ace8ed3c3  /mnt/usb-primary  ext4  defaults,nosuid,nodev,noexec,nofail,noatime  0  3
```

## Samba

We are now ready to install Samba server.

```shell
sudo apt install samba
```

We also want to create a Samba user linked to current Linux user. Make sure to specify a different password than those used for Linux login.

```shell
sudo smbpasswd -a <username>
```

Samba is communicating on TCP port 445. Create a firewall rule allowing this kind of traffic the same way we did with SSH.

```shell
sudo ufw allow proto tcp from 192.168.1.0/24 to any port 445
```

Let's have a look at default Samba shares.

```shell
sudo nano /etc/samba/smb.conf
```

There are a few unexpected settings, especially in the "Share Definitions" part near the end. In `[homes]` section, it is configured to share each user's home directory, i.e. `/home/<username>`. According to `[printers]` section, available printers are also shared with clients in local network. Let's remove all the shares below "Share Definitions" comment and add our own one called `[shared]`.

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

We also need to adjust a few settings in `[global]` section.

```
[global]
    bind interfaces only = Yes
    interfaces = 127.0.0.0/8 eth0
    map to guest = Never
    server smb encrypt = required
    restrict anonymous = 2
    hosts allow = 192.168.1.0/24
    hosts deny = 0.0.0.0/0
```

The 

sudo apt install cryptsetup

Edit crontab -e
@reboot /home/checktor/start-with-usb-token.sh

Configure Overlay filesystem

## History

* 2025-09-18: Initial release.
