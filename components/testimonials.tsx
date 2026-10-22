"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code2, GitBranch, Laptop, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

const methodologySteps = [
  {
    step: "01",
    title: "Code-First Fundamentals",
    description:
      "Move beyond passive video watching. Every lesson connects concepts directly to runnable code, interactive exercises, and structured knowledge checks.",
    icon: Code2,
    badge: "Active Coding",
  },
  {
    step: "02",
    title: "Applied Project Milestones",
    description:
      "Build real-world software modules step by step. Integrate databases, craft responsive user interfaces, and connect authenticated REST APIs.",
    icon: Laptop,
    badge: "Hands-On Labs",
  },
  {
    step: "03",
    title: "Rubric-Guided Evaluation",
    description:
      "Receive transparent, criterion-referenced evaluations on your code submissions. Understand exact benchmarks for code quality, correctness, and architecture.",
    icon: ShieldCheck,
    badge: "Objective Standards",
  },
  {
    step: "04",
    title: "Portfolio Capstone Projects",
    description:
      "Complete comprehensive end-of-course capstones. Deliver tested, documented GitHub repositories ready to showcase to employers and engineering teams.",
    icon: GitBranch,
    badge: "Verifiable Proof",
  },
]

export function Testimonials() {
  return (
    <section className="py-20 bg-muted/30 border-y border-border/70">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 space-y-3"
        >
          <Badge variant="secondary" className="rounded-full px-3.5 py-1 text-xs">
            The Learning Methodology
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            How You Build Real Technical Competence
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto sm:text-lg">
            Our instructional approach is grounded in active software construction, continuous feedback loops, and verifiable demonstration of skill.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {methodologySteps.map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.08 * index }}
            >
              <Card variant="elevated" className="h-full border-border/80 bg-card/80 transition-all duration-200 hover:-translate-y-1 hover:border-accent/50 hover:shadow-lifted">
                <CardContent className="p-6 space-y-4 flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-accent px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
                      Step {item.step}
                    </span>
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {item.badge}
                    </Badge>
                  </div>

                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>

                  <div className="space-y-2 flex-1">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
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
