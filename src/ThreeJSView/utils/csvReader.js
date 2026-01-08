import Papa from 'papaparse';

export function readCsvFile(fileName) {
    const filePath = `/assets/simulation_results/${fileName}`; // Use relative path for browser compatibility

    return new Promise((resolve, reject) => {
        fetch(filePath)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`File not found: ${fileName}`);
                }
                return response.text();
            })
            .then((data) => {
                Papa.parse(data, {
                    complete: (results) => {
                        resolve(results.data); // Resolve with the 2D array
                    },
                    error: (error) => {
                        reject(new Error(`Error parsing ${fileName}: ${error.message}`));
                    },
                });
            })
            .catch((error) => {
                reject(new Error(`Error reading ${fileName}: ${error.message}`));
            });
    });
}