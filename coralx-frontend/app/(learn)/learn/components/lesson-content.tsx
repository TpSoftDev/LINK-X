export default function LessonContent() {
    return (
      <div className="max-w-3xl mx-auto bg-gray-800 rounded-lg p-8 shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Introduction to Cryptocurrency</h1>
        <p className="mb-4 text-gray-300 leading-relaxed">
          Cryptocurrency is a digital or virtual form of currency that uses cryptography for security. Unlike traditional
          currencies issued by governments, cryptocurrencies are decentralized and typically operate on a technology
          called blockchain.
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-300">Key Concepts</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-300">
          <li>Decentralization: No central authority controls cryptocurrency</li>
          <li>Blockchain: A distributed ledger technology that records all transactions</li>
          <li>Cryptography: Ensures secure transactions and controls the creation of new units</li>
          <li>Digital Wallets: Where users store their cryptocurrency</li>
        </ul>
        <p className="mb-6 text-gray-300 leading-relaxed">
          Bitcoin, created in 2009, was the first and remains the most well-known cryptocurrency. However, there are now
          thousands of alternative cryptocurrencies, often referred to as "altcoins."
        </p>
        <h2 className="text-2xl font-semibold mt-8 mb-4 text-blue-300">Advantages of Cryptocurrency</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2 text-gray-300">
          <li>Lower transaction fees compared to traditional banking</li>
          <li>Faster international transfers</li>
          <li>Increased privacy and security</li>
          <li>Protection against inflation for some cryptocurrencies</li>
        </ul>
        <p className="text-gray-300 leading-relaxed">
          As you progress through this course, you'll gain a deeper understanding of how cryptocurrencies work, their
          potential impact on the financial world, and how you can participate in this revolutionary technology.
        </p>
      </div>
    )
  }
  
  