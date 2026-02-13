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
      category: "General Questions",
      questions: [
        {
          question: "What makes Prompt Care Academy different from other training centers?",
          answer:
            "Our difference lies in our DNA. We are the sister company to Prompt Home Health, which has led the industry in Nigeria since 2009. Our curriculum is designed by our Founder, Dr. Ike M. Okoye, who brings 10 years of American nursing experience and 16 years of Nigerian home care leadership. We don’t just teach theory; we teach a proven, world-class standard refined on Nigerian soil.",
        },
        {
          question: "Is this academy only for professional caregivers?",
          answer:
            "Not at all. While we offer professional certifications, we have specific Beginner and Family Caregiver modules designed for sons, daughters, and spouses who are currently caring for loved ones at home and want to ensure they are doing it safely and professionally.",
        },
        {
          question: "Where is the academy located?",
          answer:
            "Suite B 16, Area 11 Shopping Complex, Ahmadu Bello Way, Garki Abuja, Nigeria. 72B Nike Lake Road, Trans Ekulu, Enugu. We believe in hands-on training, so our facility is equipped with modern caregiving aids to ensure students practice in a real-world environment.",
        },
      ],
    },
    {
      category: "Enrollment & Courses",
      questions: [
        {
          question: "Do I need a medical background to enroll?",
          answer:
            "No. Our Beginner Courses are designed for individuals with no prior medical experience. We start with the heart—the ethics and basics of care—before moving to the technical hands.",
        },
        {
          question: "How long do the courses take to complete?",
          answer:
            "Course duration varies by level: Beginner/Foundation: 2–4 weeks. Intermediate/Specialized: 4–6 weeks. Pro/Advanced: 8+ weeks. These can be adjusted based on your specific schedule.",
        },
        {
          question: "Will I get a certificate upon completion?",
          answer:
            "Yes. Every graduate receives a Prompt Care Academy Certificate of Completion. Our Pro-level graduates receive a Global Professional Certification, which signifies that they have been trained to international clinical standards.",
        },
      ],
    },
    {
      category: "Career & Impact",
      questions: [
        {
          question: "Does the Academy provide jobs after graduation?",
          answer:
            "While we do not guarantee employment, our sister company, Prompt Home Health, often recruits top-performing graduates from the Academy. Additionally, being Prompt Trained is a significant advantage in the Nigerian healthcare job market due to our 16-year reputation.",
        },
        {
          question: "Can this training help me if I want to work abroad?",
          answer:
            "Our curriculum is built on American nursing standards (CNA/RN levels). While you must still meet the specific visa and licensing requirements of any country you travel to, the technical skills and Global Professional training you receive here will put you at a distinct advantage internationally.",
        },
      ],
    },
    {
      category: "Specialized Care",
      questions: [
        {
          question: "Why do you focus so much on Alzheimer’s and Dementia?",
          answer:
            "This is a personal mission for our Founder. Having returned to Nigeria in 2009 to care for his father, Dr. Okoye recognized that memory care is one of the most underserved areas in our healthcare system. Our Dementia Mastery course is our flagship program, designed to solve a crisis many Nigerian families face in silence.",
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
          <p className="text-xl text-muted-foreground">Find answers to common questions about Prompt Care Academy</p>
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
              <h3 className="text-2xl font-semibold mb-2">Don’t see your question here?</h3>
              <p className="text-muted-foreground mb-6">
                Contact Our Admissions Team or 09030910091
              </p>
              <Button asChild>
                <Link href="/contact">Contact Admissions</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}


