from pydantic import BaseModel


class ImportErrorDetail(BaseModel):
    """Детали ошибки при импорте одной строки"""
    row: int
    field: str
    message: str
    value: str | None = None


class ImportResult(BaseModel):
    """Результат импорта задач из Excel"""
    success: bool
    total_rows: int
    imported: int
    skipped: int
    errors: list[ImportErrorDetail]


class ExportFilters(BaseModel):
    """Фильтры для экспорта задач"""
    status: str | None = None
    priority: str | None = None
    search: str | None = None
    project_id: str | None = None
    department_id: str | None = None
