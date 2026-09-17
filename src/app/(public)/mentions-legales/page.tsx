export default function MentionsLegalesPage() {
  return (
    <div className="max-w-2xl mx-auto py-6 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-3xl font-bold text-encre">Mentions Légales</h1>
      </div>

      <div className="bg-surface border border-bordure rounded-2xl p-6 sm:p-8 space-y-6 text-sm text-encre leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-encre">Édition du site</h2>
          <p className="text-encre-douce">
            Le site <strong>Ma boîte à prière</strong> est un service bénévole d'intercession chrétienne communautaire.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-encre">Hébergement</h2>
          <p className="text-encre-douce">
            L'application est hébergée par la société <strong>Vercel Inc.</strong> (440 N Barranca Ave #4133, Covina, CA 91723).
            La base de données Postgres et les services d'authentification sont opérés par <strong>Supabase Inc.</strong>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-bold text-encre">Contact</h2>
          <p className="text-encre-douce">
            Pour toute question ou demande de modération urgente, vous pouvez nous écrire à l'adresse : <code>contact@maboiteapriere.fr</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
