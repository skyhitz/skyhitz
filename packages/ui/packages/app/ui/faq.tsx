import { H2, P } from 'app/design/typography'
import { Pressable, View } from 'react-native'
import { AnimatePresence, MotiView } from 'moti'
import { useState } from 'react'
import { AnimateHeight } from './animate-height'
import { FaqProps } from 'app/types'

export default function Faq({ title, faqs }: FaqProps) {
  const [openFaq, setOpenFaq] = useState(-1)

  const handleOnPress = (index: number) => {
    if (index === openFaq) {
      setOpenFaq(-1)
      return
    }
    setOpenFaq(index)
  }

  return (
    <View
      className="mx-auto w-full max-w-7xl px-6 pb-24 md:pb-32 lg:px-8"
      id="faq"
    >
      <View className="mx-auto w-full divide-y divide-gray-900/10">
        <H2 className="text-2xl font-bold leading-10 tracking-tight">
          {title}
        </H2>
        <View className="mt-10 space-y-6 divide-y divide-gray-900/10">
          {faqs.map((faq, index) => {
            return (
              <View key={index} className="pt-6">
                <Pressable onPress={() => handleOnPress(index)}>
                  <View className="flex flex-row justify-between">
                    <P className="text-base font-semibold leading-7">
                      {faq.question}
                    </P>
                    <AnimatePresence exitBeforeEnter>
                      {openFaq === index && (
                        <MotiView
                          animate={{ opacity: 1 }}
                          transition={{ type: 'timing', duration: 250 }}
                          exit={{
                            opacity: 0,
                          }}
                          key="minus"
                        >
                          <P className="text-2xl leading-7">-</P>
                        </MotiView>
                      )}
                      {openFaq !== index && (
                        <MotiView
                          animate={{ opacity: 1 }}
                          transition={{ type: 'timing', duration: 250 }}
                          exit={{
                            opacity: 0,
                          }}
                          key="plus"
                        >
                          <P className="text-2xl leading-7">+</P>
                        </MotiView>
                      )}
                    </AnimatePresence>
                  </View>
                </Pressable>

                <AnimateHeight hide={openFaq !== index}>
                  <AnimatePresence>
                    {openFaq === index && (
                      <MotiView
                        animate={{ opacity: 1 }}
                        transition={{ type: 'timing', duration: 600 }}
                        exit={{
                          opacity: 0,
                        }}
                      >
                        <P className="mt-4 text-base leading-7">{faq.answer}</P>
                      </MotiView>
                    )}
                  </AnimatePresence>
                </AnimateHeight>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}
