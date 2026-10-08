"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

interface Testimonial {
  name: string
  role: string
  content: string
  rating: number
  image?: string
}

const testimonials: Testimonial[] = [
  {
    name: "Amina Hassan",
    role: "Nursing Student",
    content: "Prompt Care Academy has transformed my career. The courses are comprehensive, and the instructors are incredibly supportive. I've gained practical skills that I use every day in my work.",
    rating: 5,
  },
  {
    name: "David Okonkwo",
    role: "Healthcare Professional",
    content: "The flexibility of learning at my own pace while maintaining quality education is outstanding. The certificate I earned has opened new opportunities for me in the healthcare sector.",
    rating: 5,
  },
  {
    name: "Fatima Ibrahim",
    role: "Medical Student",
    content: "I was impressed by the depth of knowledge and practical approach. The hands-on training modules helped me understand complex concepts easily. Highly recommended!",
    rating: 5,
  },
  {
    name: "Emeka Nwosu",
    role: "Caregiver",
    content: "As someone new to healthcare, Prompt Care Academy provided me with the foundation I needed. The courses are well-structured, and the support team is always ready to help.",
    rating: 5,
  },
  {
    name: "Grace Adeyemi",
    role: "Nursing Graduate",
    content: "The quality of education here is exceptional. I've recommended Prompt Care Academy to many of my colleagues. The practical skills I learned are invaluable.",
    rating: 5,
  },
  {
    name: "Michael Okafor",
    role: "Healthcare Administrator",
    content: "The courses are up-to-date with current industry standards. I've enhanced my skills significantly and feel more confident in my role. Thank you, Prompt Care Academy!",
    rating: 5,
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Students Say</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Here's what our students have to say about their learning experience.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                  <div className="pt-4 border-t">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}





