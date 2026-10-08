// MongoDB Database Layer
// Replaces mock-db.ts with real MongoDB operations

import { getCollection } from './mongodb'
import type {
  User,
  PendingRegistration,
  Course,
  Enrollment,
  Payment,
  Certificate,
  Quiz,
  Assignment,
  AdminLog,
  Category,
  LearningNote,
  PaymentEvent,
  OnboardingEvent,
} from './types'
import { ObjectId } from 'mongodb'

// Helper to convert MongoDB document to our type
function toObject<T extends { id: string }>(doc: any): T {
  if (!doc) return doc
  const { _id, ...rest } = doc
  // Convert Date fields
  const converted: any = { ...rest, id: _id.toString() }
  if (converted.createdAt && typeof converted.createdAt === 'object') {
    converted.createdAt = new Date(converted.createdAt)
  }
  if (converted.updatedAt && typeof converted.updatedAt === 'object') {
    converted.updatedAt = new Date(converted.updatedAt)
  }
  if (converted.otpExpiresAt && typeof converted.otpExpiresAt === 'object') {
    converted.otpExpiresAt = new Date(converted.otpExpiresAt)
  }
  if (converted.enrolledAt && typeof converted.enrolledAt === 'object') {
    converted.enrolledAt = new Date(converted.enrolledAt)
  }
  if (converted.completedAt && typeof converted.completedAt === 'object') {
    converted.completedAt = new Date(converted.completedAt)
  }
  if (converted.paidAt && typeof converted.paidAt === 'object') {
    converted.paidAt = new Date(converted.paidAt)
  }
  if (converted.refundedAt && typeof converted.refundedAt === 'object') {
    converted.refundedAt = new Date(converted.refundedAt)
  }
  if (converted.lastVerificationAt && typeof converted.lastVerificationAt === 'object') {
    converted.lastVerificationAt = new Date(converted.lastVerificationAt)
  }
  if (converted.verificationLockExpiresAt && typeof converted.verificationLockExpiresAt === 'object') {
    converted.verificationLockExpiresAt = new Date(converted.verificationLockExpiresAt)
  }
  if (converted.manualReviewCreatedAt && typeof converted.manualReviewCreatedAt === 'object') {
    converted.manualReviewCreatedAt = new Date(converted.manualReviewCreatedAt)
  }
  if (converted.manualReviewUpdatedAt && typeof converted.manualReviewUpdatedAt === 'object') {
    converted.manualReviewUpdatedAt = new Date(converted.manualReviewUpdatedAt)
  }
  if (converted.issuedAt && typeof converted.issuedAt === 'object') {
    converted.issuedAt = new Date(converted.issuedAt)
  }
  if (converted.createdAt && typeof converted.createdAt === 'object') {
    converted.createdAt = new Date(converted.createdAt)
  }
  if (converted.completedAt && typeof converted.completedAt === 'object') {
    converted.completedAt = new Date(converted.completedAt)
  }
  return converted as T
}

// Helper to convert our type to MongoDB document
function toDocument<T extends { id: string }>(obj: T): any {
  const { id, ...rest } = obj as any
  const doc: any = { ...rest }
  
  // Remove id field, MongoDB will use _id
  delete doc.id
  
  // Convert id to _id if valid ObjectId
  if (id && ObjectId.isValid(id)) {
    doc._id = new ObjectId(id)
  } else if (!doc._id) {
    doc._id = new ObjectId()
  }
  
  return doc
}

export class MongoDBDatabase {
  // User methods
  async findUserByEmail(email: string): Promise<User | undefined> {
    const collection = await getCollection<User>('users')
    const doc = await collection.findOne({ email })
    return doc ? toObject<User>(doc) : undefined
  }

  async findUserById(id: string): Promise<User | undefined> {
    const collection = await getCollection<User>('users')
    let doc
    if (ObjectId.isValid(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) })
    } else {
      // Try finding by id field if it's not a valid ObjectId
      doc = await collection.findOne({ id })
    }
    return doc ? toObject<User>(doc) : undefined
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const collection = await getCollection<User>('users')
    const newUser: Omit<User, 'id'> = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newUser as User))
    return { ...newUser, id: result.insertedId.toString() } as User
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const collection = await getCollection<User>('users')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const result = await collection.findOneAndUpdate(
      query,
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )
    return result ? toObject<User>(result) : undefined
  }

  async getAllUsers(): Promise<User[]> {
    const collection = await getCollection<User>('users')
    const docs = await collection.find({}).toArray()
    return docs.map(toObject<User>)
  }

  async getCategories(): Promise<Category[]> {
    const collection = await getCollection<Category>('categories')
    const docs = await collection.find({}).sort({ name: 1 }).toArray()
    return docs.map(toObject<Category>)
  }

  async createCategory(name: string): Promise<Category> {
    const collection = await getCollection<Category>('categories')
    const newCategory: Omit<Category, 'id'> = {
      name,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newCategory as Category))
    return { ...newCategory, id: result.insertedId.toString() } as Category
  }

  async updateCategory(id: string, name: string): Promise<Category | undefined> {
    const collection = await getCollection<Category>('categories')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const result = await collection.findOneAndUpdate(
      query,
      { $set: { name, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )
    return result ? toObject<Category>(result) : undefined
  }

  async deleteUser(id: string): Promise<boolean> {
    const collection = await getCollection<User>('users')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const result = await collection.deleteOne(query)
    return result.deletedCount > 0
  }

  async findPendingRegistrationByEmail(email: string): Promise<PendingRegistration | undefined> {
    const collection = await getCollection<PendingRegistration>('pending_registrations')
    const doc = await collection.findOne({ email })
    return doc ? toObject<PendingRegistration>(doc) : undefined
  }

  async findPendingRegistrationById(id: string): Promise<PendingRegistration | undefined> {
    const collection = await getCollection<PendingRegistration>('pending_registrations')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const doc = await collection.findOne(query)
    return doc ? toObject<PendingRegistration>(doc) : undefined
  }

  async createPendingRegistration(
    registration: Omit<PendingRegistration, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PendingRegistration> {
    const collection = await getCollection<PendingRegistration>('pending_registrations')
    const newRegistration: Omit<PendingRegistration, 'id'> = {
      ...registration,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newRegistration as PendingRegistration))
    return { ...newRegistration, id: result.insertedId.toString() } as PendingRegistration
  }

  async updatePendingRegistration(
    id: string,
    updates: Partial<PendingRegistration>
  ): Promise<PendingRegistration | undefined> {
    const collection = await getCollection<PendingRegistration>('pending_registrations')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const result = await collection.findOneAndUpdate(
      query,
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )
    return result ? toObject<PendingRegistration>(result) : undefined
  }

  async deletePendingRegistration(id: string): Promise<boolean> {
    const collection = await getCollection<PendingRegistration>('pending_registrations')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const result = await collection.deleteOne(query)
    return result.deletedCount > 0
  }

  async getExpiredPendingRegistrations(cutoff: Date): Promise<PendingRegistration[]> {
    const collection = await getCollection<PendingRegistration>('pending_registrations')
    const docs = await collection.find({ otpExpiresAt: { $lte: cutoff } }).sort({ otpExpiresAt: 1 }).toArray()
    return docs.map(toObject<PendingRegistration>)
  }

  // Admin log methods
  async createAdminLog(log: Omit<AdminLog, 'id' | 'createdAt'>): Promise<AdminLog> {
    const collection = await getCollection<AdminLog>('admin_logs')
    const newLog: Omit<AdminLog, 'id'> = {
      ...log,
      createdAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newLog as AdminLog))
    return { ...newLog, id: result.insertedId.toString() } as AdminLog
  }

  async getAdminLogs(limit = 50): Promise<AdminLog[]> {
    const collection = await getCollection<AdminLog>('admin_logs')
    const docs = await collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray()
    return docs.map(toObject<AdminLog>)
  }

  // Course methods
  async getAllCourses(): Promise<Course[]> {
    const collection = await getCollection<Course>('courses')
    const docs = await collection.find({ approved: true }).toArray()
    return docs.map(toObject<Course>)
  }

  async getAllCoursesIncludingDrafts(): Promise<Course[]> {
    const collection = await getCollection<Course>('courses')
    const docs = await collection.find({}).toArray()
    return docs.map(toObject<Course>)
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    const collection = await getCollection<Course>('courses')
    let doc
    if (ObjectId.isValid(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) })
    } else {
      doc = await collection.findOne({ id })
    }
    return doc ? toObject<Course>(doc) : undefined
  }

  async getCourseBySlug(slug: string): Promise<Course | undefined> {
    const collection = await getCollection<Course>('courses')
    const doc = await collection.findOne({ slug })
    return doc ? toObject<Course>(doc) : undefined
  }

  async getCoursesByInstructor(instructorId: string): Promise<Course[]> {
    const collection = await getCollection<Course>('courses')
    const docs = await collection.find({ instructorId }).toArray()
    return docs.map(toObject<Course>)
  }

  async createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    const collection = await getCollection<Course>('courses')
    const newCourse: Omit<Course, 'id'> = {
      ...course,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newCourse as Course))
    return { ...newCourse, id: result.insertedId.toString() } as Course
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<Course | undefined> {
    const collection = await getCollection<Course>('courses')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const result = await collection.findOneAndUpdate(
      query,
      { $set: { ...updates, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )
    return result ? toObject<Course>(result) : undefined
  }

  async deleteCourse(id: string): Promise<boolean> {
    const collection = await getCollection<Course>('courses')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const result = await collection.deleteOne(query)
    return result.deletedCount > 0
  }

  // Enrollment methods
  async getEnrollmentsByUserId(userId: string): Promise<Enrollment[]> {
    const collection = await getCollection<Enrollment>('enrollments')
    const docs = await collection.find({ userId }).toArray()
    return docs.map(toObject<Enrollment>)
  }

  async getEnrollment(userId: string, courseId: string): Promise<Enrollment | undefined> {
    const collection = await getCollection<Enrollment>('enrollments')
    const doc = await collection.findOne({ userId, courseId })
    return doc ? toObject<Enrollment>(doc) : undefined
  }

  async getEnrollmentById(id: string): Promise<Enrollment | undefined> {
    const collection = await getCollection<Enrollment>('enrollments')
    let doc
    if (ObjectId.isValid(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) })
    } else {
      // Try finding by id field
      doc = await collection.findOne({ id })
    }
    return doc ? toObject<Enrollment>(doc) : undefined
  }

  async createEnrollment(enrollment: Omit<Enrollment, 'id'>): Promise<Enrollment> {
    const collection = await getCollection<Enrollment>('enrollments')
    const newEnrollment: Omit<Enrollment, 'id'> = {
      ...enrollment,
      enrolledAt: new Date(),
    }
    try {
      const result = await collection.insertOne(toDocument(newEnrollment as Enrollment))
      return { ...newEnrollment, id: result.insertedId.toString() } as Enrollment
    } catch (error: any) {
      // Unique (userId, courseId) index guard: return existing enrollment for idempotency.
      if (error?.code === 11000) {
        const existing = await collection.findOne({ userId: enrollment.userId, courseId: enrollment.courseId })
        if (existing) return toObject<Enrollment>(existing)
      }
      throw error
    }
  }

  async updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const collection = await getCollection<Enrollment>('enrollments')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const result = await collection.findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: 'after' }
    )
    return result ? toObject<Enrollment>(result) : undefined
  }

  async getAllEnrollments(): Promise<Enrollment[]> {
    const collection = await getCollection<Enrollment>('enrollments')
    const docs = await collection.find({}).toArray()
    return docs.map(toObject<Enrollment>)
  }

  // Payment methods
  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    const collection = await getCollection<Payment>('payments')
    const docs = await collection.find({ userId }).sort({ createdAt: -1 }).toArray()
    return docs.map(toObject<Payment>)
  }

  async getPaymentByReference(reference: string): Promise<Payment | undefined> {
    const collection = await getCollection<Payment>('payments')
    const doc = await collection.findOne({ reference })
    return doc ? toObject<Payment>(doc) : undefined
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    const collection = await getCollection<Payment>('payments')
    let doc
    if (ObjectId.isValid(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) })
    } else {
      doc = await collection.findOne({ id })
    }
    return doc ? toObject<Payment>(doc) : undefined
  }

  async createPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
    const collection = await getCollection<Payment>('payments')
    const newPayment: Omit<Payment, 'id'> = {
      ...payment,
      createdAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newPayment as Payment))
    return { ...newPayment, id: result.insertedId.toString() } as Payment
  }

  async getStalePayments(params: { statuses: Payment['status'][]; cutoff: Date; limit: number }): Promise<Payment[]> {
    const collection = await getCollection<Payment>('payments')
    const docs = await collection
      .find({
        status: { $in: params.statuses },
        createdAt: { $lte: params.cutoff },
      })
      .sort({ createdAt: 1 })
      .limit(params.limit)
      .toArray()
    return docs.map(toObject<Payment>)
  }

  async acquirePaymentVerificationLock(reference: string, maxAttempts = 5): Promise<Payment | undefined> {
    const collection = await getCollection<Payment>('payments')
    const now = new Date()
    const token = new ObjectId().toString()
    const lockExpiry = new Date(now.getTime() + 2 * 60 * 1000)

    const result = await collection.findOneAndUpdate(
      {
        reference,
        status: { $in: ['pending', 'processing'] },
        $expr: { $lt: [{ $ifNull: ['$verificationAttempts', 0] }, maxAttempts] },
        $or: [
          { verificationLocked: { $ne: true } },
          { verificationLockExpiresAt: { $lte: now } },
          { verificationLockExpiresAt: { $exists: false } },
        ],
      },
      {
        $set: {
          verificationLocked: true,
          verificationLockToken: token,
          verificationLockExpiresAt: lockExpiry,
          lastVerificationAt: now,
          status: 'processing',
        },
        $inc: { verificationAttempts: 1 },
      },
      { returnDocument: 'after' }
    )
    return result ? toObject<Payment>(result) : undefined
  }

  async releasePaymentVerificationLock(reference: string): Promise<Payment | undefined> {
    const collection = await getCollection<Payment>('payments')
    const result = await collection.findOneAndUpdate(
      { reference },
      {
        $set: { verificationLocked: false },
        $unset: { verificationLockToken: '', verificationLockExpiresAt: '' },
      },
      { returnDocument: 'after' }
    )
    return result ? toObject<Payment>(result) : undefined
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const collection = await getCollection<Payment>('payments')
    const query = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { id }
    const result = await collection.findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: 'after' }
    )
    return result ? toObject<Payment>(result) : undefined
  }

  async updatePaymentByReference(reference: string, updates: Partial<Payment>): Promise<Payment | undefined> {
    const collection = await getCollection<Payment>('payments')
    const result = await collection.findOneAndUpdate(
      { reference },
      { $set: updates },
      { returnDocument: 'after' }
    )
    return result ? toObject<Payment>(result) : undefined
  }

  async getAllPayments(): Promise<Payment[]> {
    const collection = await getCollection<Payment>('payments')
    const docs = await collection.find({}).sort({ createdAt: -1 }).toArray()
    return docs.map(toObject<Payment>)
  }

  // Certificate methods
  async getCertificatesByUserId(userId: string): Promise<Certificate[]> {
    const collection = await getCollection<Certificate>('certificates')
    const docs = await collection.find({ userId }).toArray()
    return docs.map(toObject<Certificate>)
  }

  async getCertificateByVerificationCode(code: string): Promise<Certificate | undefined> {
    const collection = await getCollection<Certificate>('certificates')
    const doc = await collection.findOne({ verificationCode: code })
    return doc ? toObject<Certificate>(doc) : undefined
  }

  async createCertificate(certificate: Omit<Certificate, 'id'>): Promise<Certificate> {
    const collection = await getCollection<Certificate>('certificates')
    const newCertificate: Omit<Certificate, 'id'> = {
      ...certificate,
      issuedAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newCertificate as Certificate))
    return { ...newCertificate, id: result.insertedId.toString() } as Certificate
  }

  // Quiz methods
  async getQuizById(id: string): Promise<Quiz | undefined> {
    const collection = await getCollection<Quiz>('quizzes')
    let doc
    if (ObjectId.isValid(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) })
    } else {
      doc = await collection.findOne({ id })
    }
    return doc ? toObject<Quiz>(doc) : undefined
  }

  // Assignment methods
  async getAssignmentById(id: string): Promise<Assignment | undefined> {
    const collection = await getCollection<Assignment>('assignments')
    let doc
    if (ObjectId.isValid(id)) {
      doc = await collection.findOne({ _id: new ObjectId(id) })
    } else {
      doc = await collection.findOne({ id })
    }
    return doc ? toObject<Assignment>(doc) : undefined
  }

  async createPaymentEvent(event: Omit<PaymentEvent, 'id' | 'createdAt'>): Promise<PaymentEvent> {
    const collection = await getCollection<PaymentEvent>('payment_events')
    const newEvent: Omit<PaymentEvent, 'id'> = {
      ...event,
      createdAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newEvent as PaymentEvent))
    return { ...newEvent, id: result.insertedId.toString() } as PaymentEvent
  }

  async createOnboardingEvent(event: Omit<OnboardingEvent, 'id' | 'createdAt'>): Promise<OnboardingEvent> {
    const collection = await getCollection<OnboardingEvent>('onboarding_events')
    const newEvent: Omit<OnboardingEvent, 'id'> = {
      ...event,
      createdAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newEvent as OnboardingEvent))
    return { ...newEvent, id: result.insertedId.toString() } as OnboardingEvent
  }

  async getOnboardingEvents(limit = 500): Promise<OnboardingEvent[]> {
    const collection = await getCollection<OnboardingEvent>('onboarding_events')
    const docs = await collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray()
    return docs.map(toObject<OnboardingEvent>)
  }

  // Learning note methods
  async getNotesByUserId(userId: string): Promise<LearningNote[]> {
    const collection = await getCollection<LearningNote>('notes')
    const docs = await collection.find({ userId }).sort({ updatedAt: -1 }).toArray()
    return docs.map(toObject<LearningNote>)
  }

  async createNote(note: Omit<LearningNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<LearningNote> {
    const collection = await getCollection<LearningNote>('notes')
    const newNote: Omit<LearningNote, 'id'> = {
      ...note,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const result = await collection.insertOne(toDocument(newNote as LearningNote))
    return { ...newNote, id: result.insertedId.toString() } as LearningNote
  }

  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    const collection = await getCollection<LearningNote>('notes')
    const query = ObjectId.isValid(noteId) ? { _id: new ObjectId(noteId), userId } : { id: noteId, userId }
    const result = await collection.deleteOne(query)
    return result.deletedCount > 0
  }
}

// Singleton instance
let dbInstance: MongoDBDatabase | null = null

export function getDatabase(): MongoDBDatabase {
  if (!dbInstance) {
    dbInstance = new MongoDBDatabase()
  }
  return dbInstance
}

// Export as db for backward compatibility
export const db = getDatabase()




