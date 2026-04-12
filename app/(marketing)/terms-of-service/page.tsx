import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function TermsOfServicePage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 px-4 py-14 sm:px-6 sm:py-20 md:py-24">
        <section className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="mb-6 text-3xl font-bold text-slate-900 sm:text-4xl text-center">Terms of Service</h1>
          <p className="mb-6 text-sm text-slate-500 text-center">Last updated: April 6, 2026</p>

          <div className="mt-8 space-y-8 text-slate-700 text-center">
            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Acceptance of Terms</h2>
              <p className="mb-6 text-center">
                By using InboxReveal, you agree to these terms and all applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Service Use</h2>
              <p className="mb-6 text-center">
                You agree to use the service lawfully, protect your account credentials, and avoid any abusive or unauthorized activity.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Account & Data</h2>
              <p className="mb-6 text-center">
                You are responsible for the data and actions associated with your account and connected email providers.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Contact</h2>
              <p className="mb-6 text-center">
                For legal or compliance questions, contact support@inboxreveal.com.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
