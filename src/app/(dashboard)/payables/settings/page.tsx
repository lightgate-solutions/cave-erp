/** biome-ignore-all lint/suspicious/noExplicitAny: <> */

import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getAllCustomCategories } from "@/actions/payables/settings";
import { getAllOrganizationCurrencies } from "@/actions/invoicing/currencies";
import { AddCategoryDialog } from "@/components/payables/add-category-dialog";
import { CategoryList } from "@/components/payables/category-list";
import { CurrencySettings } from "@/components/invoicing/currency-settings";

export default async function PayablesSettingsPage() {
  const [categories, currencies] = await Promise.all([
    getAllCustomCategories(),
    getAllOrganizationCurrencies(),
  ]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Payables Settings</h2>
        <p className="text-muted-foreground">
          Configure tax rates, vendor categories, and currencies
        </p>
      </div>

      <Tabs defaultValue="taxes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="taxes">Tax Configuration</TabsTrigger>
          <TabsTrigger value="categories">Custom Categories</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
        </TabsList>

        {/* Tax Configuration Tab */}
        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tax Configuration</CardTitle>
                  <CardDescription>
                    Manage tax types and default rates for bills
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tax Configuration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tax Type</TableHead>
                    <TableHead>Tax Name</TableHead>
                    <TableHead>Default Rate</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>VAT</TableCell>
                    <TableCell>Value Added Tax</TableCell>
                    <TableCell>7.5%</TableCell>
                    <TableCell>Standard VAT rate</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>WHT</TableCell>
                    <TableCell>Withholding Tax</TableCell>
                    <TableCell>5.0%</TableCell>
                    <TableCell>Standard WHT rate</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      <div>
                        <p className="mb-2">
                          Tax configurations will be loaded from the server
                        </p>
                        <p className="text-sm">
                          Click "Add Tax Configuration" to create a new tax type
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tax Configuration Guide</CardTitle>
              <CardDescription>
                How to use tax configurations in bills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">
                <h4 className="font-medium mb-2">Available Tax Types:</h4>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>
                    <strong>VAT:</strong> Value Added Tax - Standard sales tax
                  </li>
                  <li>
                    <strong>WHT:</strong> Withholding Tax - Tax withheld at
                    source
                  </li>
                  <li>
                    <strong>Sales Tax:</strong> General sales tax
                  </li>
                  <li>
                    <strong>GST:</strong> Goods and Services Tax
                  </li>
                  <li>
                    <strong>Custom:</strong> Define your own tax type
                  </li>
                </ul>
              </div>
              <div className="text-sm mt-4">
                <h4 className="font-medium mb-2">How to Use:</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Configure default rates here for quick selection</li>
                  <li>
                    When creating bills, taxes can be added with custom rates
                  </li>
                  <li>WHT supports certificate number tracking</li>
                  <li>Multiple taxes can be applied to a single bill</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Custom Vendor Categories</CardTitle>
                  <CardDescription>
                    Manage custom categories for vendor classification
                  </CardDescription>
                </div>
                <AddCategoryDialog />
              </div>
            </CardHeader>
            <CardContent>
              <CategoryList categories={categories as any[]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default Categories</CardTitle>
              <CardDescription>
                Pre-defined vendor categories available by default
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-1">Services</div>
                  <div className="text-sm text-muted-foreground">
                    Professional services, consulting, contractors
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-1">Goods</div>
                  <div className="text-sm text-muted-foreground">
                    Physical products, materials, inventory
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium mb-1">Utilities</div>
                  <div className="text-sm text-muted-foreground">
                    Electricity, water, internet, phone services
                  </div>
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>
                  These default categories are always available. Create custom
                  categories for vendor types specific to your business.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currencies Tab */}
        <TabsContent value="currencies" className="space-y-4">
          <CurrencySettings initialCurrencies={currencies} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
