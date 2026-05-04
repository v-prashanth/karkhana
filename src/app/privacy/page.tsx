export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Privacy</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          Karkhana stores business information like contacts, bills, payments, expenses, and staff details only to help each organization run its work. We do not show one business&apos;s private records to another business without an explicit share or connection flow.
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          Shared document links only expose the document that was intentionally shared. Internal financial records, settings, and business data remain private to the organization.
        </p>
      </div>
    </main>
  );
}
