const pastelColors = [
    'rgba(249, 148, 170, 0.8)',
    'rgba(188, 228, 255, 0.78)',
    'rgba(255, 245, 219, 0.93)',
    'rgba(184, 255, 243, 0.82)',
    'rgba(194, 164, 255, 0.85)',
    'rgba(225, 125, 232, 0.89)',  // template with pastels cause I fw the colors
    'rgba(249, 216, 251, 0.92)',
    'rgba(255, 231, 176, 0.87)'
];






async function load_savings_data() {
    try {
        const savings_plan = document.getElementById('savings_plan');
        const response = await fetch('/expenses');
        if (!response.ok) throw new Error('Did not get expenses correctly');
        
        const savingsArray = await response.json();

        const labels = savingsArray.map(item => item.category);
        const data = savingsArray.map(item => item.amount);
        const backgroundColor = pastelColors.slice(0,labels.length);

        const savings_data = {
            labels : labels,
            datasets: [{
                label: 'Expenses' ,
                data: data,
                backgroundColor: backgroundColor
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
            }
        };

            new Chart(savings_plan, doughnut_config);
        } catch (err) {
            console.error('Failed to load savings ', err);
        }


            
};

async function load_stocks() {
try {
    const best_performing = document.getElementById('best_performing');
    const response = await fetch('/stock_performance');
    if (!response.ok) throw new Error('Did not get stocks_performances correctly');
    
    const stocks_array = await response.json();

    const stock_names = stocks_array.map(item => item.stock_name);
    const stock_performance = stocks_array.map(item => item.value);
    const backgroundColor = pastelColors.slice(0, stock_names.length);

    const stock_datas = {
    labels: stock_names,
    datasets: [{
        label: 'Stock Performance',
        data: stock_performance,
        backgroundColor: backgroundColor
    }]
    };

    const bar_config = {
    type: 'bar',
    data: stock_datas,
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
            display: false
        }
        }
    },
    };

    new Chart(best_performing, bar_config);
} catch (err) {
    console.error('Failed to load stock_performances ', err);
}
}


async function load_stock_history() {
try {
    const stock_history_chart = document.getElementById('stocks_history');
    const response = await fetch('/stock_history');
    if (!response.ok) throw new Error('Did not get stock history correctly');

    const stocks_array = await response.json();

    if (!stocks_array || stocks_array.length === 0) {
    throw new Error('Stock history data is empty');
    }

    if (!stocks_array[0].data) {
    throw new Error('data is missing from first stock');
    }

    const labels = Object.keys(stocks_array[0].data);

    const datasets = stocks_array.map((item, index) => ({
    label: item.stock_name,
    data: Object.values(item.data),
    borderColor: pastelColors[index % pastelColors.length],
    fill: false
    }));

    const line_config = {
    type: 'line',
    data: { labels, datasets },
    options: {
        responsive: true,
        plugins: {
        legend: { position: 'top' },
        title: { display: true, text: 'Stock history over time' }
        }
    }
    };

    new Chart(stock_history_chart, line_config);
} catch (err) {
    console.error('Failed to load stock history ', err);
}
}



load_savings_data();
load_stocks();
load_stock_history();


