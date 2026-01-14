"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface VehicleExpensesTabProps {
  vehicleId: string;
}

export function VehicleExpensesTab({ vehicleId }: VehicleExpensesTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["vehicle-expenses", vehicleId],
    queryFn: async () => {
      const response = await fetch(
        `/api/finance/expenses?vehicleId=${vehicleId}&limit=100`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground">
        Loading expenses...
      </div>
    );
  }

  const expenses = data?.expenses || [];

  if (expenses.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No expenses recorded for this vehicle yet.
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map(
            (expense: {
              id: number;
              title: string;
              description: string | null;
              fleetExpenseCategory: string | null;
              category: string | null;
              amount: string;
              expenseDate: string;
            }) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{expense.title}</p>
                    {expense.description && (
                      <p className="text-sm text-muted-foreground">
                        {expense.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {expense.fleetExpenseCategory || expense.category || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  ₦{Number(expense.amount).toLocaleString()}
                </TableCell>
                <TableCell>
                  {new Date(expense.expenseDate).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </div>
  );
}
