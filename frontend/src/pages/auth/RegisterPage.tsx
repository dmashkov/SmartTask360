import { useState } from "react";
import { Link } from "react-router-dom";
import { useRegister } from "../../modules/auth";
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from "../../shared/ui";
import { getErrorMessage } from "../../shared/api";

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (password !== confirmPassword) {
      setValidationError("Пароли не совпадают");
      return;
    }

    if (password.length < 8) {
      setValidationError("Пароль должен быть не менее 8 символов");
      return;
    }

    registerMutation.mutate({
      email,
      password,
      full_name: fullName,
    });
  };

  const error = validationError || (registerMutation.error ? getErrorMessage(registerMutation.error) : null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SmartTask360</h1>
          <p className="text-gray-600 mt-2">
            Создайте аккаунт для начала работы
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Регистрация</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <Input
                label="Полное имя"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иван Иванов"
                required
                autoComplete="name"
                autoFocus
              />

              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.ru"
                required
                autoComplete="email"
              />

              <Input
                label="Пароль"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 8 символов"
                required
                autoComplete="new-password"
              />

              <Input
                label="Подтверждение пароля"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите пароль"
                required
                autoComplete="new-password"
                error={
                  confirmPassword && password !== confirmPassword
                    ? "Пароли не совпадают"
                    : undefined
                }
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={registerMutation.isPending}
              >
                Создать аккаунт
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              Уже есть аккаунт?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Войти
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
