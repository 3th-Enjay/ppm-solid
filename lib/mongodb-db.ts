// MongoDB Database Layer
// Replaces mock-db.ts with real MongoDB operations

import { getCollection } from './mongodb'
import type {
  User,
  Course,
  Enrollment,
  Payment,
  Certificate,
  Quiz,
  Assignment,
  AdminLog,
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
    const docs = await collection.find({ published: true }).toArray()
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
    const result = await collection.insertOne(toDocument(newEnrollment as Enrollment))
    return { ...newEnrollment, id: result.insertedId.toString() } as Enrollment
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
