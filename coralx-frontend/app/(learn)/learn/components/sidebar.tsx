import Link from "next/link"

const modules = [
  {
    section: "Fundamentals",
    items: [
      { id: 1, title: "Introduction to Cryptocurrency" },
      { id: 2, title: "Blockchain Technology" },
      { id: 3, title: "Types of Cryptocurrencies" },
    ],
  },
  {
    section: "Practical Knowledge",
    items: [
      { id: 4, title: "Crypto Wallets and Security" },
      { id: 5, title: "Buying and Selling Crypto" },
      { id: 6, title: "Crypto Mining" },
    ],
  },
  {
    section: "Advanced Topics",
    items: [
      { id: 7, title: "DeFi and Smart Contracts" },
      { id: 8, title: "Crypto Regulations" },
      { id: 9, title: "Crypto Investment Strategies" },
      { id: 10, title: "Future of Cryptocurrency" },
    ],
  },
  {
    section: "Assessment",
    items: [{ id: 11, title: "Skills Check" }],
  },
]

export default function Sidebar() {
  return (
    <nav className="w-64 bg-gray-900 text-gray-300 p-4 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-400">CryptoEdu</h2>
      {modules.map((module, index) => (
        <div key={index} className="mb-6">
          <h3 className="text-lg font-semibold mb-2 text-gray-400">{module.section}</h3>
          <ul>
            {module.items.map((item) => (
              <li key={item.id} className="mb-2">
                <Link
                  href={`#module-${item.id}`}
                  className="block py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200"
                >
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

