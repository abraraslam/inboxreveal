import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 px-4 py-14 sm:px-6 sm:py-20">
        <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-500">Last updated: April 6, 2026</p>

          <div className="mt-8 space-y-6 text-slate-700">
            <section>
              <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
              <p className="mt-2">
                InboxReveal helps you analyze and manage your email workflows. This page explains what data we
                collect, why we collect it, and how we protect it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">Data We Process</h2>
              <p className="mt-2">
                We process account information, selected mailbox metadata, and content needed to power summaries,
                analysis, and drafting features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">How We Use Data</h2>
              <p className="mt-2">
                Data is used to provide core product functionality, improve response quality, and maintain service
                reliability and security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-slate-900">Your Choices</h2>
              <p className="mt-2">
                You can disconnect providers, request deletion, and contact support for privacy-related questions at
                support@inboxreveal.com.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
