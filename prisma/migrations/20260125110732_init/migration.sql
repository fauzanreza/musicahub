-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `avatar` VARCHAR(191) NULL,
    `isCreator` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_username_idx`(`username`),
    INDEX `User_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Track` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `audioUrl` VARCHAR(191) NOT NULL,
    `coverUrl` VARCHAR(191) NULL,
    `genre` VARCHAR(191) NOT NULL,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `playCount` INTEGER NOT NULL DEFAULT 0,
    `creatorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Track_creatorId_idx`(`creatorId`),
    INDEX `Track_genre_idx`(`genre`),
    INDEX `Track_createdAt_idx`(`createdAt`),
    INDEX `Track_playCount_idx`(`playCount`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Vote` (
    `id` VARCHAR(191) NOT NULL,
    `type` ENUM('UP', 'DOWN') NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Vote_trackId_idx`(`trackId`),
    INDEX `Vote_userId_idx`(`userId`),
    UNIQUE INDEX `Vote_trackId_userId_key`(`trackId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Comment_trackId_idx`(`trackId`),
    INDEX `Comment_userId_idx`(`userId`),
    INDEX `Comment_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LikedTrack` (
    `id` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LikedTrack_userId_idx`(`userId`),
    INDEX `LikedTrack_trackId_idx`(`trackId`),
    UNIQUE INDEX `LikedTrack_trackId_userId_key`(`trackId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Playlist` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `coverUrl` VARCHAR(191) NULL,
    `isPublic` BOOLEAN NOT NULL DEFAULT true,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Playlist_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlaylistTrack` (
    `id` VARCHAR(191) NOT NULL,
    `position` INTEGER NOT NULL DEFAULT 0,
    `playlistId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlaylistTrack_playlistId_idx`(`playlistId`),
    INDEX `PlaylistTrack_trackId_idx`(`trackId`),
    UNIQUE INDEX `PlaylistTrack_playlistId_trackId_key`(`playlistId`, `trackId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlayHistory` (
    `id` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `playedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlayHistory_userId_playedAt_idx`(`userId`, `playedAt`),
    INDEX `PlayHistory_trackId_idx`(`trackId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Track` ADD CONSTRAINT `Track_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LikedTrack` ADD CONSTRAINT `LikedTrack_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LikedTrack` ADD CONSTRAINT `LikedTrack_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist` ADD CONSTRAINT `Playlist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistTrack` ADD CONSTRAINT `PlaylistTrack_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `Playlist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistTrack` ADD CONSTRAINT `PlaylistTrack_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayHistory` ADD CONSTRAINT `PlayHistory_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlayHistory` ADD CONSTRAINT `PlayHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
