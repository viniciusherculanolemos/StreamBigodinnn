// Funções específicas para a página de notícias
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página de notícias
    const categoryButtons = document.querySelectorAll('.category-btn');
    const newsItems = document.querySelectorAll('.news-item');
    const newsSearchForm = document.getElementById('newsSearchForm');
    const newsSearchInput = document.getElementById('newsSearchInput');
    
    // Inicialização da filtragem por categoria
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Remove a classe active de todos os botões
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                
                // Adiciona a classe active ao botão clicado
                this.classList.add('active');
                
                // Obtém a categoria selecionada
                const category = this.getAttribute('data-category');
                
                // Filtra os itens de notícias
                newsItems.forEach(item => {
                    if (category === 'all' || item.getAttribute('data-category') === category) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
    }
    
    // Inicialização da pesquisa de notícias
    if (newsSearchForm) {
        newsSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtém o termo de pesquisa
            const searchTerm = newsSearchInput.value.toLowerCase();
            
            if (searchTerm.trim() === '') {
                // Se a pesquisa estiver vazia, mostra todos os itens
                newsItems.forEach(item => {
                    item.style.display = 'block';
                });
                return;
            }
            
            // Filtra os itens de notícias com base no termo de pesquisa
            newsItems.forEach(item => {
                const title = item.querySelector('h3').textContent.toLowerCase();
                const excerpt = item.querySelector('.news-excerpt').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || excerpt.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    }
    
    // Inicialização do formulário de newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simulação de envio do formulário
            // Em uma implementação real, isso faria uma requisição AJAX para enviar os dados
            
            alert('Inscrição realizada com sucesso! Obrigado por se inscrever na nossa newsletter.');
            
            // Limpa o formulário
            newsletterForm.reset();
        });
    }
    
    // Inicialização dos links de artigos completos
    const newsLinks = document.querySelectorAll('.news-link');
    
    if (newsLinks.length > 0) {
        newsLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Em uma implementação real, isso redirecionaria para a página do artigo
                // Para este exemplo, vamos apenas mostrar um alerta
                
                alert('Em uma implementação completa, este link levaria à página do artigo completo.');
            });
        });
    }
    
    // Inicialização dos botões de compartilhamento
    const shareButtons = document.querySelectorAll('.share-btn');
    
    if (shareButtons.length > 0) {
        shareButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Em uma implementação real, isso abriria as opções de compartilhamento
                // Para este exemplo, vamos apenas mostrar um alerta
                
                alert('Em uma implementação completa, este botão permitiria compartilhar o artigo.');
            });
        });
    }
});
