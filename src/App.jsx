import React, { useState } from "react";
import Papa from "papaparse";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { mean, median, standardDeviation } from "simple-statistics";

function App() {
  const [data, setData] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [numericColumns, setNumericColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [insights, setInsights] = useState("");

  // Handle CSV Upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (result) => {
        const parsedData = cleanData(result.data);
        if (parsedData.length === 0) return;

        const columnNames = Object.keys(parsedData[0]);
        setColumns(columnNames);

        const numericCols = columnNames.filter(
          (col) => !isNaN(parseFloat(parsedData[0][col]))
        );

        setNumericColumns(numericCols);
        setSelectedColumns(numericCols.slice(0, 2));

        setData(parsedData);
        setGraphData(generateGraphData(parsedData, columnNames, numericCols));
        generateInsights(parsedData, numericCols);
      },
      header: true,
      skipEmptyLines: true,
    });
  };

  // Clean and Filter Data
  const cleanData = (parsedData) => {
    return parsedData
      .map((row) => {
        let cleanedRow = {};
        Object.keys(row).forEach((col) => {
          let value = row[col]?.trim();
          cleanedRow[col] =
            value === "" || isNaN(value) ? value : parseFloat(value);
        });
        return cleanedRow;
      })
      .filter((row) => Object.values(row).some((val) => val !== ""));
  };

  // Generate Graph Data
  const generateGraphData = (data, columns, numericCols) => {
    return data.map((row) => {
      let rowData = { name: row[columns[0]] };
      numericCols.forEach((column) => {
        if (!isNaN(parseFloat(row[column]))) {
          rowData[column] = parseFloat(row[column]);
        }
      });
      return rowData;
    });
  };

  // Handle Column Selection
  const handleColumnSelection = (event) => {
    const selected = Array.from(
      event.target.selectedOptions,
      (option) => option.value
    );
    setSelectedColumns(selected);
  };

  // Generate Insights
  const generateInsights = (parsedData, numericCols) => {
    let insightsMessage = "Insights:\n\n";

    numericCols.forEach((col) => {
      const columnData = parsedData
        .map((row) => parseFloat(row[col]))
        .filter((val) => !isNaN(val));
      if (columnData.length === 0) return;

      const avg = mean(columnData).toFixed(2);
      const med = median(columnData).toFixed(2);
      const stdev = standardDeviation(columnData).toFixed(2);
      const min = Math.min(...columnData);
      const max = Math.max(...columnData);
      const trend = detectTrend(columnData);

      insightsMessage += `For "${col}":\n`;
      insightsMessage += `- Avg: ${avg}, Median: ${med}, StDev: ${stdev}\n`;
      insightsMessage += `- Min: ${min}, Max: ${max}\n`;
      insightsMessage += `- Trend: ${trend}\n\n`;
    });

    setInsights(insightsMessage);
  };

  // Detect Trend
  const detectTrend = (data) => {
    const trend = data.reduce((acc, val, index, arr) => {
      if (index === 0) return acc;
      return acc + (arr[index] - arr[index - 1]);
    }, 0);
    return trend > 0 ? "Increasing" : trend < 0 ? "Decreasing" : "Stable";
  };

  return (
    <div className="container">
      <h1>CSV Data Visualization</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} />

      <h3>Select Columns</h3>
      <select multiple value={selectedColumns} onChange={handleColumnSelection}>
        {numericColumns.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>

      <h3>Line Graph: {selectedColumns.join(" & ")}</h3>
      <div className="scrollable-graph-container">
        <ResponsiveContainer width={graphData.length * 20} height={400}>
          <LineChart
            data={graphData}
            margin={{ top: 20, right: 20, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={1} />
            <YAxis />
            <Tooltip />
            <Legend />
            {selectedColumns.map((column, index) => (
              <Line
                key={column}
                type="monotone"
                dataKey={column}
                stroke={`hsl(${
                  (index * 360) / selectedColumns.length
                }, 70%, 50%)`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h3>Insights:</h3>
      <div className="insights">
        <pre>{insights}</pre>
      </div>
    </div>
  );
}

export default App;
