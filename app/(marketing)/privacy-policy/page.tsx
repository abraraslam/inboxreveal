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
                InboxReveal helps you analyze and manage your email workflows. This page explains what data we collect, why we collect it, how we use it, with whom we share it, and how we protect your privacy.<br /><br />
                We are committed to transparency and protecting your privacy. This policy outlines our practices regarding the collection, use, and safeguarding of your information when you use our services.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Data We Process</h2>
              <p className="mb-6 text-center">
                We process account information, selected mailbox metadata, and content needed to power summaries, analysis, and drafting features. This may include your email address, message metadata (such as sender, recipient, subject, and timestamps), and the content of emails you choose to analyze or draft.<br /><br />
                We only request the minimum data necessary to provide our features. Sensitive data is never used for purposes unrelated to your experience with InboxReveal.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">How We Use Data</h2>
              <p className="mb-6 text-center">
                Data is used to provide core product functionality, improve response quality, and maintain service reliability and security. We do not use your data for advertising or marketing purposes.<br /><br />
                We may use aggregated, anonymized data to improve our algorithms and services, but this data cannot be used to identify you personally.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Data Sharing and Disclosure</h2>
              <p className="mb-6 text-center">
                We do <span className="font-semibold">not</span> sell or rent your Google user data to third parties. We do not share, transfer, or disclose your Google user data except in the following limited circumstances:
                <ul className="list-disc list-inside mt-4 text-left mx-auto max-w-2xl">
                  <li>With service providers who help us operate our service (such as cloud hosting and analytics providers), strictly for the purpose of providing our services and under confidentiality agreements.</li>
                  <li>If required by law, regulation, legal process, or governmental request.</li>
                  <li>To protect the rights, property, or safety of InboxReveal, our users, or the public, as required or permitted by law.</li>
                </ul>
                We do not allow any third party to access your Google user data except as necessary to provide the core functionality of InboxReveal, and only under strict confidentiality and security obligations.<br /><br />
                <span className="font-semibold">No Advertising or Marketing Use:</span> We do not use your Google user data for advertising or marketing purposes.<br /><br />
                <span className="font-semibold">No Human Access:</span> No human will read your Google user data except as necessary for security, support, or to comply with applicable law.<br /><br />
                We carefully vet all partners and require them to adhere to strict privacy and security standards.
              </p>
            </section>
            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Children's Privacy</h2>
              <p className="mb-6 text-center">
                InboxReveal is not intended for children under 13. We do not knowingly collect or solicit personal information from anyone under the age of 13. If you believe a child under 13 has provided us with personal information, please contact us and we will promptly delete such information.<br /><br />
                We encourage parents and guardians to monitor their children’s use of online services and to contact us if they have any concerns about a child’s information.
              </p>
            </section>
            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Google API Services User Data Policy</h2>
              <p className="mb-6 text-center">
                InboxReveal’s use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-700 underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.<br /><br />
                We regularly review our compliance with Google’s policies and update our practices as needed to maintain your trust and meet regulatory requirements.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Data Protection and Security</h2>
              <p className="mb-6 text-center">
                We implement industry-standard security measures to protect your data, including:
                <ul className="list-disc list-inside mt-4 text-left mx-auto max-w-2xl">
                  <li>Encryption of data in transit (using HTTPS/TLS) and at rest.</li>
                  <li>Access controls and authentication to restrict access to authorized personnel only.</li>
                  <li>Regular security reviews and monitoring for unauthorized access or vulnerabilities.</li>
                  <li>Data minimization: we only store the minimum data necessary to provide our services.</li>
                </ul>
                If you have questions about our security practices, contact us at support@inboxreveal.com.<br /><br />
                We are committed to ongoing improvement of our security posture and regularly update our systems to address new threats.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Data Retention and Deletion</h2>
              <p className="mb-6 text-center">
                We retain your Google user data only as long as necessary to provide our services to you and to comply with legal obligations. You may request deletion of your account and associated Google user data at any time by contacting support@inboxreveal.com or using the account deletion feature in the app. Upon deletion, we will remove your Google user data from our systems within 30 days, except where retention is required by law.<br /><br />
                We periodically review our data retention policies to ensure we are not keeping your information longer than necessary. You are always in control of your data and can request its removal at any time.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold text-slate-900 text-center">Your Choices</h2>
              <p className="mb-6 text-center">
                You can disconnect providers, request deletion, and contact support for privacy-related questions at support@inboxreveal.com. You may also review and update your preferences at any time in the app settings.<br /><br />
                We are committed to giving you clear options and control over your information. If you have any questions or concerns about your privacy, please reach out to us.
              </p>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
