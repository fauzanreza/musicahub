-- CreateTable
CREATE TABLE `Jam` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `roomCode` VARCHAR(191) NULL,
    `hostId` VARCHAR(191) NOT NULL,
    `currentTrackId` VARCHAR(191) NULL,
    `isPlaying` BOOLEAN NOT NULL DEFAULT false,
    `seekPosition` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Jam_roomCode_key`(`roomCode`),
    INDEX `Jam_hostId_idx`(`hostId`),
    INDEX `Jam_roomCode_idx`(`roomCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JamMember` (
    `id` VARCHAR(191) NOT NULL,
    `jamId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('HOST', 'LISTENER') NOT NULL DEFAULT 'LISTENER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JamMember_jamId_idx`(`jamId`),
    INDEX `JamMember_userId_idx`(`userId`),
    UNIQUE INDEX `JamMember_jamId_userId_key`(`jamId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JamTrack` (
    `id` VARCHAR(191) NOT NULL,
    `jamId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JamTrack_jamId_idx`(`jamId`),
    INDEX `JamTrack_trackId_idx`(`trackId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JamMessage` (
    `id` VARCHAR(191) NOT NULL,
    `jamId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JamMessage_jamId_idx`(`jamId`),
    INDEX `JamMessage_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Jam` ADD CONSTRAINT `Jam_hostId_fkey` FOREIGN KEY (`hostId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Jam` ADD CONSTRAINT `Jam_currentTrackId_fkey` FOREIGN KEY (`currentTrackId`) REFERENCES `Track`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JamMember` ADD CONSTRAINT `JamMember_jamId_fkey` FOREIGN KEY (`jamId`) REFERENCES `Jam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JamMember` ADD CONSTRAINT `JamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JamTrack` ADD CONSTRAINT `JamTrack_jamId_fkey` FOREIGN KEY (`jamId`) REFERENCES `Jam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JamTrack` ADD CONSTRAINT `JamTrack_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JamMessage` ADD CONSTRAINT `JamMessage_jamId_fkey` FOREIGN KEY (`jamId`) REFERENCES `Jam`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JamMessage` ADD CONSTRAINT `JamMessage_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
