'use client'
import { H2, P } from 'app/design/typography'
import { useState } from 'react'
import { AnimateHeight } from '../animate-height'
import { YStack, XStack, Button } from 'tamagui'

// Define the props interface directly to avoid import errors
interface FaqItemProps {
  question: string
  answer: string
}

interface FaqComponentProps {
  title?: string
  faqs?: FaqItemProps[]
}

export default function Faq({ title, faqs = [] }: FaqComponentProps) {
  const [openFaq, setOpenFaq] = useState(-1)

  const handleOnPress = (index: number) => {
    if (index === openFaq) {
      setOpenFaq(-1)
      return
    }
    setOpenFaq(index)
  }

  return (
    <YStack
      marginHorizontal="auto"
      width="100%"
      maxWidth="$7xl"
      paddingHorizontal="$6"
      paddingBottom="$24"
      md={{ paddingBottom: '$32' }}
      lg={{ paddingHorizontal: '$8' }}
      id="faq"
    >
      <YStack marginHorizontal="auto" width="100%">
        <H2
          fontSize="$7"
          fontWeight="bold"
          lineHeight="$10"
          letterSpacing="$-1"
        >
          {title}
        </H2>
        <YStack marginTop="$10" space="$6">
          {faqs.map((faq, index) => {
            return (
              <YStack
                key={index}
                paddingTop="$6"
                borderTopWidth={index > 0 ? 1 : 0}
                borderTopColor="$gray9"
              >
                <Button
                  onPress={() => handleOnPress(index)}
                  backgroundColor="transparent"
                  padding="$0"
                  justifyContent="space-between"
                  flexDirection="row"
                >
                  <XStack flex={1} flexDirection="row" justifyContent="space-between">
                    <P
                      fontSize="$4"
                      fontWeight="600"
                      lineHeight="$7"
                      flex={1}
                      textAlign="left"
                    >
                      {faq.question}
                    </P>
                    <P
                      fontSize="$7"
                      lineHeight="$7"
                      animation="quick"
                    >
                      {openFaq === index ? '-' : '+'}
                    </P>
                  </XStack>
                </Button>

                <AnimateHeight hide={openFaq !== index}>
                  {openFaq === index && (
                    <P
                      marginTop="$4"
                      fontSize="$4"
                      lineHeight="$7"
                      animation="quick"
                    >
                      {faq.answer}
                    </P>
                  )}
                </AnimateHeight>
              </YStack>
            )
          })}
        </YStack>
      </YStack>
    </YStack>
  )
}
