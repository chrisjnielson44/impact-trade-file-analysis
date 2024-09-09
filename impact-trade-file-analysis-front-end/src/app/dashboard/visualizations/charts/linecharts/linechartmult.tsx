'use client';
import React, { useState, useEffect } from 'react'
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const chartConfig = {
    Uncollateralized_PFE: {
        label: "Uncollateralized PFE: ",
        color: "hsl(var(--chart-1))",
    },
    Collateralized_PFE: {
        label: "Collateralized PFE: ",
        color: "hsl(var(--chart-2))",
    },
} satisfies ChartConfig

interface Counterparty {
    id: string;
    name: string;
    transactions: { id: string; name: string }[];
}

interface PFEChartComponentProps {
    product: string;
    metric: string;
    chartType: string;
}

const engines = [
    { id: "f22", label: "F22", color: "hsl(var(--chart-1))" },
    { id: "quic", label: "QUIC", color: "hsl(var(--chart-2))" },
]

const pfeTypes = [
    { id: "collateralized", label: "Collateralized PFE" },
    { id: "uncollateralized", label: "Uncollateralized PFE" },
]

export function PFEChartComponent({ product, metric, chartType }: PFEChartComponentProps) {
    const [selectedEngines, setSelectedEngines] = useState<string[]>(["f22"])
    const [selectedPFETypes, setSelectedPFETypes] = useState<string[]>(["collateralized"])
    const [selectedCounterparty, setSelectedCounterparty] = useState("")
    const [selectedTransaction, setSelectedTransaction] = useState("all")
    const [chartData, setChartData] = useState([])
    const [counterpartiesData, setCounterpartiesData] = useState<{ [key: string]: Counterparty[] }>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [openCounterparty, setOpenCounterparty] = useState(false)
    const [openTransaction, setOpenTransaction] = useState(false)

    const handleEngineChange = (engineId: string, checked: boolean) => {
        setSelectedEngines(prev => {
            const newEngines = checked ? [...prev, engineId] : prev.filter(id => id !== engineId)
            if (newEngines.length === 0) {
                return [engineId] // Ensure at least one engine is always selected
            }
            return newEngines
        })
        setSelectedCounterparty("")
        setSelectedTransaction("all")
    }

    const handlePFETypeChange = (typeId: string, checked: boolean) => {
        setSelectedPFETypes(prev =>
            checked ? [...prev, typeId] : prev.filter(id => id !== typeId)
        )
    }

    useEffect(() => {
        const fetchCounterpartiesForEngine = async (engine: string) => {
            const response = await fetch(`/api/${engine}/counterparties-transactions`)
            if (!response.ok) {
                throw new Error(`Failed to fetch ${engine} counterparties`)
            }
            return response.json()
        }

        setIsLoading(true)
        setError(null)

        Promise.all(selectedEngines.map(fetchCounterpartiesForEngine))
            .then(results => {
                const newCounterpartiesData = results.reduce((acc, data, index) => {
                    acc[selectedEngines[index]] = data
                    return acc
                }, {})
                setCounterpartiesData(newCounterpartiesData)
            })
            .catch(error => {
                console.error('Error fetching counterparties and transactions:', error)
                setError('Failed to load counterparties. Please try again.')
            })
            .finally(() => setIsLoading(false))
    }, [selectedEngines])

    const getAvailableCounterparties = () => {
        const counterpartySets = selectedEngines.map(engine =>
            new Set(counterpartiesData[engine]?.map(cp => cp.id) || [])
        )
        return counterpartySets.reduce((a, b) => new Set([...a].filter(x => b.has(x))))
    }

    const getAvailableTransactions = () => {
        if (!selectedCounterparty) return []
        const transactionSets = selectedEngines.map(engine =>
            new Set(counterpartiesData[engine]?.find(cp => cp.id === selectedCounterparty)?.transactions.map(t => t.id) || [])
        )
        return Array.from(transactionSets.reduce((a, b) => new Set([...a].filter(x => b.has(x)))))
    }

    useEffect(() => {
        if (selectedCounterparty && selectedEngines.length > 0 && selectedPFETypes.length > 0) {
            setIsLoading(true)
            setError(null)

            const fetchDataForEngine = async (engine: string) => {
                const apiEndpoint = `/api/${engine}/${product}/${metric}`
                const queryParams = new URLSearchParams({
                    counterpartyId: selectedCounterparty,
                    chartType: chartType,
                    pfeTypes: selectedPFETypes.join(',')
                })
                if (selectedTransaction && selectedTransaction !== 'all') {
                    queryParams.append('transactionId', selectedTransaction)
                }
                const response = await fetch(`${apiEndpoint}?${queryParams}`)
                if (!response.ok) {
                    throw new Error('Network response was not ok')
                }
                return response.json()
            }

            Promise.all(selectedEngines.map(fetchDataForEngine))
                .then(results => {
                    // Combine results from different engines
                    const combinedData = results.reduce((acc, curr, index) => {
                        const engine = selectedEngines[index]
                        return curr.map((item: { Collateralized_PFE: any; Uncollateralized_PFE: any; }, i: string | number) => ({
                            ...acc[i],
                            [`${engine}_Collateralized_PFE`]: item.Collateralized_PFE,
                            [`${engine}_Uncollateralized_PFE`]: item.Uncollateralized_PFE,
                        }))
                    }, [])
                    setChartData(combinedData)
                })
                .catch(error => {
                    console.error(`Error fetching PFE data:`, error)
                    setError(`Failed to load PFE data. Please try again.`)
                })
                .finally(() => setIsLoading(false))
        }
    }, [selectedCounterparty, selectedTransaction, selectedEngines, selectedPFETypes, product, metric, chartType])

    const handleCounterpartyChange = (value: string) => {
        setSelectedCounterparty(value)
        setSelectedTransaction("all")
        setOpenCounterparty(false)
    }

    const handleTransactionChange = (value: string) => {
        setSelectedTransaction(value)
        setOpenTransaction(false)
    }

    const getSelectedCounterpartyName = () => {
        return selectedCounterparty || 'None';
    }

    const getSelectedTransactionName = () => {
        if (selectedTransaction === 'all') return 'All Transactions';
        return selectedTransaction || 'None';
    }

    if (isLoading) {
        return <div>Loading...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    const availableCounterparties = Array.from(getAvailableCounterparties())
    const availableTransactions = getAvailableTransactions()

    return (
        <Card>
            <CardHeader className="flex">
                <div className="flex items-center justify-between w-full">
                    <CardTitle>
                        PFE Chart
                        {selectedCounterparty && (
                            <span className="ml-2 text-md font-normal text-gray-500">
                                (Counterparty: {getSelectedCounterpartyName()},
                                Transaction: {getSelectedTransactionName()})
                            </span>
                        )}
                    </CardTitle>
                    <div className="flex space-x-4">
                        <Popover open={openCounterparty} onOpenChange={setOpenCounterparty}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCounterparty}
                                    className="w-[200px] justify-between"
                                >
                                    {selectedCounterparty || "Select Counterparty"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search counterparty..." />
                                    <CommandList>
                                        <CommandEmpty>No counterparty found.</CommandEmpty>
                                        <CommandGroup>
                                            {availableCounterparties.map((cp) => (
                                                <CommandItem
                                                    key={cp}
                                                    onSelect={() => handleCounterpartyChange(cp)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedCounterparty === cp ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {cp}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        <Popover open={openTransaction} onOpenChange={setOpenTransaction}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openTransaction}
                                    className="w-[200px] justify-between"
                                >
                                    {selectedTransaction === "all" ? "All Transactions" : selectedTransaction || "Select Transaction..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="Search transaction..." />
                                    <CommandList>
                                        <CommandEmpty>No transaction found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem onSelect={() => handleTransactionChange("all")}>
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedTransaction === "all" ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                All Transactions
                                            </CommandItem>
                                            {availableTransactions.map((t) => (
                                                <CommandItem
                                                    key={t}
                                                    onSelect={() => handleTransactionChange(t)}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedTransaction === t ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {t}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center space-x-4">
                        <h4 className="font-medium min-w-[60px]">Engines:</h4>
                        <div className="flex space-x-4">
                        {engines.map((engine) => (
                            <div key={engine.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={engine.id}
                                    checked={selectedEngines.includes(engine.id)}
                                    onCheckedChange={(checked) => handleEngineChange(engine.id, checked as boolean)}
                                />
                                <label htmlFor={engine.id}>{engine.label}</label>
                            </div>
                        ))}
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <h4 className="font-medium min-w-[60px]">PFE Types:</h4>
                        <div className="flex space-x-4">
                        {pfeTypes.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2">
                                <Checkbox
                                    id={type.id}
                                    checked={selectedPFETypes.includes(type.id)}
                                    onCheckedChange={(checked) => handlePFETypeChange(type.id, checked as boolean)}
                                />
                                <label htmlFor={type.id}>{type.label}</label>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
                {selectedCounterparty ? (
                    <ChartContainer config={chartConfig} className="min-h-[200px] h-[700px] w-full">
                        <LineChart
                            accessibilityLayer
                            data={chartData}
                            margin={{
                                left: 12,
                                right: 12,
                            }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="day"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                            {selectedEngines.map(engineId => {
                                const engine = engines.find(e => e.id === engineId)!
                                return selectedPFETypes.map(pfeType => (
                                    <Line
                                        key={`${engineId}_${pfeType}`}
                                        dataKey={`${engineId}_${pfeType === 'collateralized' ? 'Collateralized' : 'Uncollateralized'}_PFE`}
                                        type="monotone"
                                        stroke={engine.color}
                                        strokeWidth={2}
                                        strokeDasharray={pfeType === 'collateralized' ? '3 3' : ''}
                                        dot={false}
                                        name={`${engine.label} ${pfeType} PFE`}
                                    />
                                ))
                            })}
                            <Legend />
                        </LineChart>
                    </ChartContainer>
                ) : (
                    <div className="flex items-center justify-center h-[700px] bg-background rounded-lg">
                        <p className="text-lg text-gray-500">Please select a Counterparty ID to view the PFE chart.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}