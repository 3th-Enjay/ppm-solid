"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HelpCircle, MessageCircle } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function FAQPage() {
  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I create an account?",
          answer:
            'Click the "Sign Up" button in the top right corner, fill in your details, and verify your email address. You can start browsing courses immediately after registration.',
        },
        {
          question: "Are the courses really free to browse?",
          answer:
            "Yes! You can browse all course information, view curriculum, and watch free preview lessons without any payment. You only pay when you're ready to enroll in a course.",
        },
        {
          question: "What payment methods do you accept?",
          answer:
            "We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor Paystack. We support multiple currencies including USD, GBP, and NGN.",
        },
      ],
    },
    {
      category: "Courses",
      questions: [
        {
          question: "How long do I have access to a course?",
          answer:
            "Once you purchase a course, you have lifetime access to all course materials, including any future updates. Learn at your own pace without any time restrictions.",
        },
        {
          question: "Can I download course videos?",
          answer:
            "Course videos are available for streaming only to protect our instructors' content. However, you can access your courses from any device at any time with an internet connection.",
        },
        {
          question: "Do you offer certificates?",
          answer:
            "Yes! Upon completing a course, you'll receive a certificate of completion that you can share on LinkedIn, add to your resume, or display on your portfolio.",
        },
        {
          question: "What if I'm not satisfied with a course?",
          answer:
            "We offer a 30-day money-back guarantee. If you're not satisfied with a course for any reason within 30 days of purchase, contact our support team for a full refund.",
        },
      ],
    },
    {
      category: "Learning",
      questions: [
        {
          question: "Can I learn at my own pace?",
          answer:
            "All courses are self-paced. You can start, pause, and resume lessons whenever you want. There are no deadlines or schedules to follow.",
        },
        {
          question: "Are there quizzes and assignments?",
          answer:
            "Yes, most courses include quizzes to test your knowledge and practical assignments to apply what you've learned. These help reinforce your understanding of the material.",
        },
        {
          question: "Can I interact with instructors?",
          answer:
            "While courses are pre-recorded for flexibility, many instructors actively participate in course discussions and Q&A sections. Premium courses may include direct instructor support.",
        },
      ],
    },
    {
      category: "Account & Billing",
      questions: [
        {
          question: "How do I update my payment information?",
          answer:
            "Go to your account settings, click on 'Billing,' and update your payment methods. You can add, remove, or set a default payment method at any time.",
        },
        {
          question: "Can I share my account with others?",
          answer:
            "Each account is for individual use only. Sharing accounts violates our terms of service and may result in account suspension. Consider gift cards for friends or family.",
        },
        {
          question: "How do I cancel or request a refund?",
          answer:
            "Visit your purchase history, find the course, and click 'Request Refund' within 30 days of purchase. Our support team will process your request within 3-5 business days.",
        },
      ],
    },
  ]

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">Find answers to common questions about Promptcare Academy</p>
        </motion.div>

        {/* FAQs by Category */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * categoryIndex }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge>{category.category}</Badge>
                  </div>

                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, index) => (
                      <AccordionItem key={index} value={`${categoryIndex}-${index}`}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-12"
        >
          <Card className="bg-muted/50">
            <CardContent className="p-8 text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-2xl font-semibold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-6">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <Button asChild>
                <Link href="/contact">Contact Support</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}


