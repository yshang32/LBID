import { redirect } from "next/navigation"

export default function ForwarderProfileAliasPage({ params }: { params: { slug: string } }) {
  redirect(`/zh/forwarders/${params.slug}`)
}
