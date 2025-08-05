const savings_data = {
    labels: ['Rent', 'Food', 'Utilities', 'Entertainment', 'Investments'],
    datasets: [{
        label: 'Expenses' ,
        data: [100,300,120,200,300],
        backgroundColor: [
        'rgba(249, 148, 170, 0.8)',
        'rgba(188, 228, 255, 0.78)',
        'rgba(255, 245, 219, 0.93)',
        'rgba(184, 255, 243, 0.82)',
        'rgba(194, 164, 255, 0.85)'
        ]
    }]
};

const doughnut_config = {
    type: 'doughnut',
    data: savings_data,
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Savings Plan'
            }
        }
    },
};

const labels = ['A', 'B', 'C', 'D', 'E']; // custom labels
const values = [
    Math.floor(Math.random() * 101),
    Math.floor(Math.random() * 101),
    Math.floor(Math.random() * 101),
    Math.floor(Math.random() * 101),
    Math.floor(Math.random() * 101)
]; // random values 0–100

const best_stock_data = {
    labels: labels,
    datasets: [
        {
            label: 'stock 1',
            data: values,
            borderColor: 'rgba(13, 63, 19, 0.72)',
            backgroundColor: 'rgba(142, 142, 142, 0.88)',
        }
    ]
};


const bar_config = {
    type: 'bar',
    data: best_stock_data,
    options: {
        indexAxis: 'y',
        elements: {
            bar: {
            borderWidth: 2,
            }
        },
        responsive: true,
        plugins: {
            legend: {
            position: 'right',
            },
            title: {
            display: true,
            text: 'Stock Performance'
            }
        }
    },
};

const stock_data_over_time = {
    labels: ['dec', 'jan', 'feb', 'mar', 'apr'],
    datasets: [
        {
            label: 'apple',
            data: [12, 45, 67, 30, 80],
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: false
        },
        {
            label: 'microsoft',
            data: [20, 60, 40, 90, 50],
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: false
        }
    ]
};


const line_config = {
    type: 'line',
    data: stock_data_over_time,
    options: {
    responsive: true,
    plugins: {
        legend: {
        position: 'top',
        },
        title: {
        display: true,
        text: 'Stock history over time'
        }
    }
    },
};



const savings_plan = document.getElementById('savings_plan');
const best_performing = document.getElementById('best_performing');
const stock_history = document.getElementById('stocks_history');


new Chart(savings_plan, doughnut_config);
new Chart(best_performing, bar_config);
new Chart(stock_history, line_config);

