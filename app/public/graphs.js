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


const savings_plan = document.getElementById('savings_plan');

new Chart(savings_plan, doughnut_config);

