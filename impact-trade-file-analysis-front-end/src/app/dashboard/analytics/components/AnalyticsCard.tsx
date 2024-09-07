import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import {SelectEngine} from "@/app/dashboard/components/selectors/SelectEngine";
import {SelectMetric} from "@/app/dashboard/components/selectors/SelectMetric";
import {SelectProduct} from "@/app/dashboard/components/selectors/SelectProduct";
import {TransactionTable} from "./DataTableExample"

export function AnalyticsCard() {
    return (
        <Card className="w-full h-[4/5]">
            <CardHeader>
                <div className="flex">
                    <div className="flex space-x-2 py-1">
                        <SelectEngine/>
                        <SelectProduct/>
                        <SelectMetric/>
                    </div>
                    <Button variant="outline" className="ml-auto">
                        Export
                    </Button>
                </div>

            </CardHeader>
            <CardContent>
                <TransactionTable/>
            </CardContent>
            <CardFooter>

            </CardFooter>
        </Card>
    )
}