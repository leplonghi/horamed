import { Helmet } from "react-helmet-async";
import { isLandingDomain } from "@/lib/domainConfig";

interface SEOHeadProps {
  title?: string;
  description?: string;
  noIndex?: boolean;
}

/**
 * SEO Head component that manages meta tags based on domain
 * - Landing domain (horamed.net): Full SEO enabled
 * - App domain (app.horamed.net): No indexing
 */
export const SEOHead = ({ 
  title = "HoraMed - Gestão Completa da Sua Saúde",
  description = "Plataforma completa de gestão de saúde: lembretes inteligentes, histórico médico digital, análise de exames, consultas e muito mais em um só lugar",
  noIndex = false
}: SEOHeadProps) => {
  // App domain should never be indexed
  const shouldNoIndex = noIndex || !isLandingDomain();

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      
      {shouldNoIndex && (
        <meta name="robots" content="noindex, nofollow" />
      )}

      {/* Only show OG tags on landing domain */}
      {isLandingDomain() && (
        <>
          <meta property="og:title" content={title} />
          <meta property="og:description" content={description} />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://horamed.net" />
        </>
      )}
    </Helmet>
  );
};

export default SEOHead;
