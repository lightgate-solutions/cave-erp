import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Edit,
  Plus,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  getVendor,
  getVendorStats,
  getVendorBills,
} from "@/actions/payables/vendors";
import { getVendorContacts } from "@/actions/payables/vendor-contacts";
import { getVendorBankAccounts } from "@/actions/payables/vendor-bank-accounts";

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Fetch vendor data from server
  const vendor = await getVendor(Number(id));

  if (!vendor) {
    return null;
  }

  const [contacts, bankAccounts, bills, stats] = await Promise.all([
    getVendorContacts(Number(id)),
    getVendorBankAccounts(Number(id)),
    getVendorBills(Number(id)),
    getVendorStats(Number(id)),
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      case "Suspended":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Archived":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "Overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/payables/vendors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight">
                {vendor.name}
              </h2>
              <Badge className={getStatusColor(vendor.status)}>
                {vendor.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">{vendor.vendorCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/payables/vendors/${vendor.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/payables/bills/new">
              <Plus className="mr-2 h-4 w-4" />
              New Bill
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(stats?.totalSpend || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.totalBills || 0} bills
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Building2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${Number(stats?.outstandingAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Unpaid bills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${Number(stats?.amountPaid || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overdue Amount
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${Number(stats?.overdueAmount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.overdueCount || 0} overdue bills
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
          <TabsTrigger value="bills">Bills</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Information</CardTitle>
              <CardDescription>General vendor details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Company Name
                  </div>
                  <div className="text-sm">{vendor.companyName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Category
                  </div>
                  <div className="text-sm">
                    {vendor.customCategory || vendor.category}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Email
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {vendor.email}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Phone
                  </div>
                  <div className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {vendor.phone}
                  </div>
                </div>
                {vendor.website && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Website
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Tax Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Tax ID
                    </div>
                    <div className="text-sm">{vendor.taxId || "-"}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      CAC Number
                    </div>
                    <div className="text-sm">{vendor.cacNumber || "-"}</div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Billing Address
                </div>
                <div className="text-sm">
                  <div>{vendor.billingAddress}</div>
                  <div>
                    {vendor.billingCity}, {vendor.billingState}{" "}
                    {vendor.billingPostalCode}
                  </div>
                  <div>{vendor.billingCountry}</div>
                </div>
              </div>

              <Separator />

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Payment Terms
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Default Terms
                    </div>
                    <div className="text-sm">
                      {vendor.defaultPaymentTerms || "-"}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      Default Method
                    </div>
                    <div className="text-sm">
                      {vendor.defaultPaymentMethod || "-"}
                    </div>
                  </div>
                </div>
              </div>

              {vendor.notes && (
                <>
                  <Separator />
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      Notes
                    </div>
                    <div className="text-sm p-3 bg-muted rounded-md">
                      {vendor.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Contacts</CardTitle>
              <CardDescription>Contact persons for this vendor</CardDescription>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No contacts added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{contact.name}</div>
                        {contact.isPrimary && (
                          <Badge variant="outline">Primary</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {contact.email}
                        </div>
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                      {contact.role && (
                        <div className="text-sm text-muted-foreground">
                          Role: {contact.role}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Banking Tab */}
        <TabsContent value="banking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>
                Vendor banking information for payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bankAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No bank accounts added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-4 border rounded-lg space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{account.accountName}</div>
                        <div className="flex gap-2">
                          {account.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                          {account.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-muted-foreground">Bank Name</div>
                          <div>{account.bankName}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Account Number
                          </div>
                          <div>{account.accountNumber}</div>
                        </div>
                        {account.routingNumber && (
                          <div>
                            <div className="text-muted-foreground">
                              Routing Number
                            </div>
                            <div>{account.routingNumber}</div>
                          </div>
                        )}
                        {account.swiftCode && (
                          <div>
                            <div className="text-muted-foreground">
                              SWIFT Code
                            </div>
                            <div>{account.swiftCode}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-muted-foreground">Currency</div>
                          <div>{account.currency}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bills Tab */}
        <TabsContent value="bills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bills</CardTitle>
              <CardDescription>
                All bills from this vendor ({bills.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No bills found for this vendor</p>
                  <Button asChild>
                    <Link href="/payables/bills/new">Create First Bill</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill Number</TableHead>
                      <TableHead>Vendor Invoice</TableHead>
                      <TableHead>Bill Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell>
                          <Link
                            href={`/payables/bills/${bill.id}`}
                            className="font-medium hover:underline"
                          >
                            {bill.billNumber}
                          </Link>
                        </TableCell>
                        <TableCell>{bill.vendorInvoiceNumber}</TableCell>
                        <TableCell>
                          {new Date(bill.billDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={getBillStatusColor(bill.status)}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          ${Number(bill.total).toLocaleString()}{" "}
                          {/* Note: bill does not include currency object directly here unless joined properly in getVendorBills or fetched separately */}
                          {/* For now, removing currency code to avoid error if not fetched, or assume base currency */}
                        </TableCell>
                        <TableCell className="text-right">
                          {Number(bill.amountDue) > 0 ? (
                            <span className="text-orange-600">
                              ${Number(bill.amountDue).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-green-600">Paid</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
