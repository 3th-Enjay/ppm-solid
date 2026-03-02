export const roleAnalyticsRegistry = {
  admin: [
    {
      id: "admin-revenue-trend",
      title: "Revenue Trend",
      subtitle: "Monthly revenue (NGN normalized)",
    },
    {
      id: "admin-role-distribution",
      title: "Role Distribution",
      subtitle: "Current user mix",
    },
  ],
  finance: [
    {
      id: "finance-currency-revenue",
      title: "Revenue by Currency",
      subtitle: "Completed transactions only",
    },
    {
      id: "finance-status-mix",
      title: "Transaction Status Mix",
      subtitle: "All transaction statuses",
    },
  ],
  instructor: [
    {
      id: "instructor-enrollments-by-course",
      title: "Enrollments by Course",
      subtitle: "Learner distribution",
    },
    {
      id: "instructor-quality-trend",
      title: "Course Quality Trend",
      subtitle: "Ratings by course",
    },
  ],
} as const

