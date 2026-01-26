
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { auth } from "@/lib/auth"
import { ProfileHeader } from "@/components/user/profile-header"
import { TrackList } from "@/components/user/track-list"

interface UserProfilePageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { username: true }
  })

  if (!user) {
    return {
      title: "User Not Found",
    }
  }

  return {
    title: `${user.username}'s Profile - MusicaHub`,
    description: `Listen to music by ${user.username} on MusicaHub`,
  }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params
  const session = await auth()
  
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      tracks: {
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { votes: { where: { type: 'UP' } } }
          },
          creator: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          }
        }
      },
      _count: {
        select: {
          tracks: true,
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  // Calculate total likes received
  const totalLikes = await prisma.vote.count({
    where: {
      track: {
        creatorId: id
      },
      type: 'UP'
    }
  })

  const isOwner = session?.user?.id === user.id

  // Transform user object for ProfileHeader to avoid passing large objects if not needed, 
  // but here we pass what's needed.
  // We need to ensure the avatar is a string | null. It is in the model.
  // The tracks need to match the interface in TrackList.

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      <ProfileHeader 
        user={{
          id: user.id,
          username: user.username,
          bio: user.bio,
          avatar: user.avatar,
          createdAt: user.createdAt,
          _count: user._count
        }} 
        isOwner={isOwner} 
        totalLikes={totalLikes} 
      />

      <TrackList 
        tracks={user.tracks} 
        isOwner={isOwner} 
      />
    </div>
  )
}
