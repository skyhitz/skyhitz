import { P } from 'app/design/typography'

export default function EmptyListIndicator({
  visible,
  text,
}: {
  visible: boolean
  text: string
}) {
  if (!visible) return null

  return <P className="w-full text-center text-xs">{text}</P>
}
