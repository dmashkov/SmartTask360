import { Link } from "react-router-dom";
import { Button } from "../shared/ui";

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-blue-600">404</p>
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Страница не найдена</h1>
        <p className="mt-2 text-gray-600">
          К сожалению, запрашиваемая страница не существует.
        </p>
        <div className="mt-6">
          <Link to="/">
            <Button>Вернуться на главную</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
