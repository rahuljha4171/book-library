# 📚 Book Library

![image](https://github.com/user-attachments/assets/5ace6b64-3278-44b0-9add-dbdaaa70b0f0)

## 🌐 Live Demo
[Visit the Live Website](https://book-library-olive.vercel.app/)

## 📖 Overview
**Book Library** is responsive web application that allows you to browse, search, and manage books. It provides a beautiful interface with filter and sorting capabilities to help you to find books easily.

## ✨ Key Features
- 🔍 Browse collection of books  
- 🔎 Books name and author search functionality  
- 📊 Multiple sorting options (title, year, rating)  
- 🏷️ filter (by year, rating, language)  
- 📱 Responsive design  
- 📑 Pagination  

## 🛠️ Tech Stack

- **HTML5** - Semantic markup  
- **CSS3** - Styling  
- **JavaScript (ES6+)** - Core functionality  

## 📚 API Usage
The application uses the FreeAPI public books endpoint:

```javascript
const response = await fetch('https://api.freeapi.app/api/v1/public/books');
```
## Deployment
The project is deployed on Vercel.

## 📝 Notes
- This is a frontend-only application using a public API.

- All book data is fetched from the FreeAPI service.
