# Projeto GoGEO Tweets

## Ferramentas utilizadas

* NodeJS e npm
* gulp (módulo npm)
* bower (módulo npm)

## Instalação das dependências

Na linha de comando, na raiz do repositório (pasta gogeo-tweet):

```
np install
bower install
```

## Construção

Apenas digite:

```
gulp 
```

Para compilar toda vez que houver uma alteração:

```
gup watch
```

## Executar

Para executar, após a compilação, entre na pasta dist e digite: 

```
http-server .
```

Caso não tenha, o http-server, instale-o com o comando `npm install -g http-server`.


# IMPORTANTE

* Não edite manualmente um arquivo `.css`, a menos que não exista um arquivo `.less` equivalente. 
  Todos os arquivos `.css` são sobrescritos com as definições contidas nos arquivos `.less`;
* Da mesma forma, não edite diretamente um arquivo `.js`, pois o mesmo ocorrerá, escreva seu código usando TypeScript;
* Todo o código do frontend é compilado e agrupado em um único javascript (situação que poderia ser melhorada), 
  assim como todos os stylesheets gerados, ficando somente os HTML e recursos extras copiadas diretamente para o diretório
  de saída. 
* Agrupe em módulos, as funcionalidades da aplicação. Por exemplo, todo o código para a página inicial deve estar na pasta
  welcome, assim como o dashboard numa pasta de mesmo nome.