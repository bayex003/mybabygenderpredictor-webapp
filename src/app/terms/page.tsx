export default function Terms() {
  return (
    <>
      <section className="bg-gradient-to-r from-baby-blue via-baby-purple to-baby-pink text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-bold">Terms of Use</h1>
          <p className="mt-2 text-white/90">Entertainment only — not medical advice.</p>
        </div>
      </section>
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <p className="text-gray-700">
            My Baby Gender Predictor is a playful experience. It does not provide medical advice, diagnosis,
            or treatment. Do not make health decisions based on results. By using this site you agree to our
            privacy approach and to upload only ultrasound images you have rights to use.
          </p>
          <h2 className="font-semibold text-lg mt-6">Liability</h2>
          <p className="text-gray-700 mt-2">
            We provide the service “as is” without warranties. To the maximum extent permitted by law,
            we’re not liable for losses arising from the use of this site.
          </p>
        </div>
      </main>
    </>
  );
}
