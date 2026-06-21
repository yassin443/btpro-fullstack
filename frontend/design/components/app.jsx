/* ===================== App ===================== */
function App() {
  return (
    <React.Fragment>
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
    </React.Fragment>
  );
}

const Landing = App;
window.Landing = Landing;
if (!window.__UNIFIED) {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
}
