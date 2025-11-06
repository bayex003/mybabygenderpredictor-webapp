export default function Privacy() {
  return (
    <>
      <section className="bg-gradient-to-r from-baby-blue via-baby-purple to-baby-pink text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="mt-2 text-white/90">We’re privacy-first. No accounts. No storage.</p>
        </div>
      </section>
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-6">
        <div className="bg-white rounded-2xl shadow-soft p-6">
          <h2 className="font-semibold text-lg">What we do</h2>
          <p className="mt-2 text-gray-700">
            Uploaded images are sent to our validator to check they look like a clear ultrasound side profile.
            Images are processed transiently to produce a fun guess and are <b>not stored</b>.
          </p>
          <h2 className="font-semibold text-lg mt-6">Contact</h2>
          <p className="mt-2">Email: <a className="underline" href="mailto:hello@mybabygenderpredictor.com">hello@mybabygenderpredictor.com</a></p>
        </div>
      </main>
    </>
  );
}
