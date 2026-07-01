import { SubmitTemplateForm } from './_form'

export const metadata = { title: 'Submit Template, UMKMu Freelancer' }

export default function SubmitTemplatePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Submit Template</h1>
        <p className="text-sm text-gray-500">
          Tim kami akan mereview template kamu sebelum dipublikasikan. Proses review biasanya 1-3 hari kerja.
        </p>
      </div>
      <SubmitTemplateForm />
    </div>
  )
}
