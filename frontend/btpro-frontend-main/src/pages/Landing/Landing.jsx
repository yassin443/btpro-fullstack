import '../../styles/design.css'
import useSEO from '../../utils/seo'
import Navbar from './sections/Nav'
import Hero from './sections/Hero'
import SocialProof from './sections/SocialProof'
import Features from './sections/Features'
import Steps from './sections/Steps'
import Pricing from './sections/Pricing'
import Testimonials from './sections/Testimonials'
import Faq from './sections/Faq'
import { FinalCta, Footer } from './sections/Footer'

export default function Landing() {
  useSEO({
    title: "Planner — Logiciel de gestion pour cabinets d'architecture en Algérie",
    description: "De la création du projet jusqu'à la dernière facture encaissée — Planner couvre tout le cycle de vie de votre cabinet d'architecture algérien.",
    path: '/',
  })

  return (
    <div className="planner-site bg-white text-ink antialiased">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <Steps />
        <Pricing />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
