import AuthForm from '@/components/AuthForm';

export default function AuthPage() {
  return (
    <div>
      <AuthForm />
      <p className="muted" style={{ maxWidth: 560 }}>
        Only students at your college can join your network. We check your .edu email —
        Gmail and other addresses are rejected.
      </p>
    </div>
  );
}
