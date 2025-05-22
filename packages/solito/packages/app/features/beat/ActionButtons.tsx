'use client'
import { Entry } from 'app/api/graphql/types'
import { ShareButton } from 'app/ui/buttons/ShareButton'
// import { PlayButton } from './PlayButton'
import LikeButton from 'app/ui/buttons/likeButton'
// import DownloadBtn from 'app/ui/buttons/download/index'

interface ActionButtonsProps {
  entry: Entry
}

export function ActionButtons({ entry }: ActionButtonsProps) {
  // Component is now only responsible for layout/organization of action buttons

  return (
    <>
      {/* <PlayButton entry={entry} /> */}
      {/* Like button */}
      <LikeButton entry={entry} size={22} />

      {/* Share button */}
      {/* <ShareButton
        url={`https://skyhitz.io/beat/${entry.id}`}
        title="Share this beat!"
      /> */}

      {/* Download button */}
      {/* <DownloadBtn entry={entry} size={20} className="mb-1" /> */}
    </>
  )
}
