import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 px-4 py-14 sm:px-6 sm:py-20 md:py-24">
        <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="mb-6 text-3xl font-bold text-slate-900 sm:text-4xl text-center">Privacy Policy</h1>
          <p className="mb-6 text-sm text-slate-500 text-center">Last updated: April 6, 2026</p>

          <div className="mt-8 space-y-8 text-slate-700 text-center">
            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Overview</h2>
              <p className="mb-6 text-center">
                InboxReveal helps you analyze and manage your email workflows. This page explains what data we collect, why we collect it, and how we protect it.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Data We Process</h2>
              <p className="mb-6 text-center">
                We process account information, selected mailbox metadata, and content needed to power summaries, analysis, and drafting features.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">How We Use Data</h2>
              <p className="mb-6 text-center">
                Data is used to provide core product functionality, improve response quality, and maintain service reliability and security.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Your Choices</h2>
              <p className="mb-6 text-center">
                You can disconnect providers, request deletion, and contact support for privacy-related questions at support@inboxreveal.com.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
