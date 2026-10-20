import { Form, Head, router, usePage } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { useRef, useState } from 'react';
import SecurityController from '@/actions/App/Http/Controllers/Settings/SecurityController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/security';
import type { Auth } from '@/types';

type Props = {
    passwordRules: string;
    email?: string;
    codeSent?: boolean;
    status?: string;
};

export default function Security(props: Props) {
    const { auth } = usePage<{ auth: Auth; errors?: Record<string, string> }>()
        .props;
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const codeInput = useRef<HTMLInputElement>(null);
    const [sendingCode, setSendingCode] = useState(false);

    const targetEmail = props.email ?? auth.user.email;
    const hasActiveCode =
        Boolean(props.codeSent) || props.status === 'password-code-sent';

    function handleSendCode() {
        setSendingCode(true);
        router.post(
            '/settings/password/code',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    codeInput.current?.focus();
                },
                onFinish: () => setSendingCode(false),
            },
        );
    }

    return (
        <>
            <Head title="Security settings" />

            <h1 className="sr-only">Security settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Update password"
                    description="Confirm your identity with a six-digit email code to change your password. You will be signed out after saving."
                />

                <div className="rounded-lg border border-border bg-peach/30 p-4 text-xs text-brown">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-orange" />
                            <div>
                                <p className="font-semibold text-brown">
                                    Email verification required
                                </p>
                                <p className="mt-0.5 text-muted">
                                    Send a 6-digit verification code to{' '}
                                    <strong className="text-brown">
                                        {targetEmail}
                                    </strong>
                                    . Codes expire after 10 minutes.
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={sendingCode}
                            onClick={handleSendCode}
                            data-test="send-password-code-button"
                        >
                            {sendingCode
                                ? 'Sending code…'
                                : hasActiveCode
                                  ? 'Resend code'
                                  : 'Send verification code'}
                        </Button>
                    </div>

                    {props.status === 'password-code-sent' && (
                        <p
                            role="status"
                            className="mt-3 border-t border-border/60 pt-2.5 font-medium text-emerald-700"
                        >
                            A six-digit verification code has been sent to{' '}
                            {targetEmail}. Enter it below to confirm your new
                            password.
                        </p>
                    )}
                </div>

                <Form
                    {...SecurityController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    resetOnError={[
                        'password',
                        'password_confirmation',
                        'current_password',
                    ]}
                    resetOnSuccess
                    onError={(errors) => {
                        if (errors.current_password) {
                            currentPasswordInput.current?.focus();
                        } else if (errors.password) {
                            passwordInput.current?.focus();
                        } else if (errors.code) {
                            codeInput.current?.focus();
                        }
                    }}
                    className="space-y-6"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="current_password">
                                    Current password
                                </Label>

                                <PasswordInput
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    name="current_password"
                                    className="mt-1 block w-full"
                                    autoComplete="current-password"
                                    placeholder="Current password"
                                    required
                                />

                                <InputError message={errors.current_password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">New password</Label>

                                <PasswordInput
                                    id="password"
                                    ref={passwordInput}
                                    name="password"
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder="New password"
                                    passwordrules={props.passwordRules}
                                    required
                                />

                                <InputError message={errors.password} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password_confirmation">
                                    Confirm password
                                </Label>

                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    className="mt-1 block w-full"
                                    autoComplete="new-password"
                                    placeholder="Confirm password"
                                    passwordrules={props.passwordRules}
                                    required
                                />

                                <InputError
                                    message={errors.password_confirmation}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="code">
                                    Six-digit verification code
                                </Label>

                                <Input
                                    id="code"
                                    ref={codeInput}
                                    name="code"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    placeholder="6-digit code from your email"
                                    className="mt-1 block w-full font-mono tracking-widest"
                                    required
                                />

                                <InputError message={errors.code} />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-password-button"
                                >
                                    {processing
                                        ? 'Updating password…'
                                        : 'Update password & sign out'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Security.layout = {
    breadcrumbs: [
        {
            title: 'Security settings',
            href: edit(),
        },
    ],
};
