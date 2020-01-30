const MountDevice = `xvdz`;
const MountFolder = '/scratch';
const MountFolderScript = `MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="==MYBOUNDARY=="

--==MYBOUNDARY==
Content-Type: text/x-shellscript; charset="us-ascii"

#!/bin/bash
mkfs.ext4 /dev/${MountDevice}
mkdir ${MountFolder}
mount /dev/${MountDevice} ${MountFolder}
service docker restart

--==MYBOUNDARY==`;

export const ScratchData = {
    /** Device name `xvdz` */
    Device: MountDevice,
    /** Folder where device is mounted @default /scratch */
    Folder: MountFolder,
    UserData: Buffer.from(MountFolderScript).toString('base64'),
};
