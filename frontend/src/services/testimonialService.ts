import api from '@/lib/api'

export interface Testimonial {
  id: string
  text: string
  rating: number
  author_label: string | null
  created_at: string
}

export interface TestimonialAdmin extends Testimonial {
  session_id: string | null
  visible: boolean
}

export interface TestimonialCreate {
  text: string
  rating: number
  session_id?: string
  author_label?: string
}

export async function getPublicTestimonials(limit = 6): Promise<Testimonial[]> {
  const { data } = await api.get<Testimonial[]>('/testimonials', { params: { limit } })
  return data
}

export async function submitTestimonial(payload: TestimonialCreate): Promise<void> {
  await api.post('/testimonials', payload)
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAllTestimonials(): Promise<TestimonialAdmin[]> {
  const { data } = await api.get<TestimonialAdmin[]>('/testimonials/admin/all')
  return data
}

export async function toggleTestimonialVisibility(id: string, visible: boolean): Promise<void> {
  await api.patch(`/testimonials/${id}/visibility`, null, { params: { visible } })
}

export async function deleteTestimonial(id: string): Promise<void> {
  await api.delete(`/testimonials/${id}`)
}
