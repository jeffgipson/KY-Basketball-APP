interface SEOHeadProps {
  title: string
  description: string
  canonicalPath?: string
  jsonLd?: object
}

export function SEOHead({ title, description, canonicalPath, jsonLd }: SEOHeadProps) {
  const fullTitle = `${title} | Kentucky High School Basketball Hall of Fame`
  const canonicalUrl = canonicalPath ? `https://khsbhof.pages.dev${canonicalPath}` : undefined

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
    </>
  )
}
