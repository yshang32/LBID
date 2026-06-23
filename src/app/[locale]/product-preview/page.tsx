import { FullProductPreview } from "@/components/preview/full-product-preview"

export default function ProductPreviewPage({ params }: { params: { locale: string } }) {
  return <FullProductPreview locale={params.locale} />
}
